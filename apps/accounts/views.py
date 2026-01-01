"""
Views for accounts app.
"""

from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailVerificationSerializer,
)

User = get_user_model()


@extend_schema(tags=["Authentication"])
class UserRegistrationView(generics.CreateAPIView):
    """
    Register a new user account.
    Students can self-register. Instructor registration requires admin approval.
    """

    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    @method_decorator(ratelimit(key="ip", rate="5/h", method="POST"))
    def post(self, request, *args, **kwargs):
        """Create new user account."""
        return super().post(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Save user and send verification email."""
        user = serializer.save()

        # Send verification email
        self.send_verification_email(user)

    def send_verification_email(self, user):
        """Send email verification link."""
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # In production, this would be your frontend URL
        verification_link = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"

        subject = "Verify your AssessIQ email"
        message = f"""
        Hi {user.get_short_name()},

        Please verify your email address by clicking the link below:

        {verification_link}

        This link will expire in 24 hours.

        If you didn't create an account, please ignore this email.

        Best regards,
        AssessIQ Team
        """

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )


@extend_schema(tags=["Authentication"])
class UserLoginView(TokenObtainPairView):
    """
    Login with email and password to obtain JWT tokens.
    Returns access token, refresh token, and user details.
    """

    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]

    @method_decorator(ratelimit(key="ip", rate="10/h", method="POST"))
    def post(self, request, *args, **kwargs):
        """Authenticate user and return tokens."""
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)


@extend_schema(tags=["Authentication"])
class UserLogoutView(APIView):
    """
    Logout by blacklisting the refresh token.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Blacklist refresh token."""
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Invalid token or token already blacklisted."},
                status=status.HTTP_400_BAD_REQUEST,
            )


@extend_schema(tags=["User Profile"])
class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update user profile.
    """

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Return the current user."""
        return self.request.user

    def get_serializer_class(self):
        """Use different serializers for read vs write."""
        if self.request.method == "GET":
            return UserSerializer
        return UserProfileSerializer


@extend_schema(tags=["User Profile"])
class ChangePasswordView(APIView):
    """
    Change user password.
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    @method_decorator(ratelimit(key="user", rate="3/h", method="POST"))
    def post(self, request):
        """Update user password."""
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password changed successfully."}, status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Password Reset"])
class PasswordResetRequestView(APIView):
    """
    Request password reset email.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetRequestSerializer

    @method_decorator(ratelimit(key="ip", rate="3/h", method="POST"))
    def post(self, request):
        """Send password reset email."""
        serializer = PasswordResetRequestSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data["email"]

            try:
                user = User.objects.get(email=email)

                # Generate token
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                # Send email
                reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

                subject = "Reset your AssessIQ password"
                message = f"""
                Hi {user.get_short_name()},

                You requested to reset your password. Click the link below to set a new password:

                {reset_link}

                This link will expire in 24 hours.

                If you didn't request a password reset, please ignore this email.

                Best regards,
                AssessIQ Team
                """

                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )

            except User.DoesNotExist:
                # Don't reveal if email exists
                pass

            # Always return success to prevent email enumeration
            return Response(
                {
                    "message": "If an account exists with this email, you will receive password reset instructions."
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Password Reset"])
class PasswordResetConfirmView(APIView):
    """
    Confirm password reset with token.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        """Reset password with token."""
        serializer = PasswordResetConfirmSerializer(data=request.data)

        if serializer.is_valid():
            try:
                uid = force_str(urlsafe_base64_decode(serializer.validated_data["uidb64"]))
                user = User.objects.get(pk=uid)

                # Verify token
                if default_token_generator.check_token(user, serializer.validated_data["token"]):
                    # Set new password
                    user.set_password(serializer.validated_data["new_password"])
                    user.save()

                    return Response(
                        {"message": "Password reset successful."}, status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST
                    )

            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Email Verification"])
class EmailVerificationView(APIView):
    """
    Verify user email address.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = EmailVerificationSerializer

    def post(self, request):
        """Verify email with token."""
        serializer = EmailVerificationSerializer(data=request.data)

        if serializer.is_valid():
            try:
                uid = force_str(urlsafe_base64_decode(serializer.validated_data["uidb64"]))
                user = User.objects.get(pk=uid)

                # Verify token
                if default_token_generator.check_token(user, serializer.validated_data["token"]):
                    user.is_verified = True
                    user.save()

                    return Response(
                        {"message": "Email verified successfully."}, status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {"error": "Invalid or expired verification link."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response(
                    {"error": "Invalid verification link."}, status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=["Email Verification"])
class ResendVerificationEmailView(APIView):
    """
    Resend verification email.
    """

    permission_classes = [permissions.IsAuthenticated]

    @method_decorator(ratelimit(key="user", rate="3/h", method="POST"))
    def post(self, request):
        """Resend verification email to user."""
        user = request.user

        if user.is_verified:
            return Response({"message": "Email is already verified."}, status=status.HTTP_200_OK)

        # Generate new token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        verification_link = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"

        subject = "Verify your AssessIQ email"
        message = f"""
        Hi {user.get_short_name()},

        Please verify your email address by clicking the link below:

        {verification_link}

        This link will expire in 24 hours.

        Best regards,
        AssessIQ Team
        """

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        return Response({"message": "Verification email sent."}, status=status.HTTP_200_OK)
