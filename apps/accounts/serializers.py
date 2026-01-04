"""
Serializers for accounts app.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True, required=True, style={"input_type": "password"}
    )
    role = serializers.ChoiceField(
        choices=["student", "instructor"],
        default="student",
        help_text="User role (students can self-register, instructors require admin approval)",
    )

    class Meta:
        model = User
        fields = ["email", "password", "password_confirm", "first_name", "last_name", "role"]
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
        }

    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def validate_email(self, value):
        """Validate email is unique."""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        """Create new user."""
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")

        # Create user
        user = User.objects.create_user(password=password, **validated_data)

        return user


class UserLoginSerializer(TokenObtainPairSerializer):
    """
    Custom JWT login serializer.
    """

    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove username field, use email
        self.fields.pop("username", None)
        self.fields["email"] = serializers.EmailField(required=True)

    @classmethod
    def get_token(cls, user):
        """Add custom claims to token."""
        token = super().get_token(user)

        # Add custom claims
        token["email"] = user.email
        token["role"] = user.role
        token["is_verified"] = user.is_verified

        return token

    def validate(self, attrs):
        """Validate credentials."""
        # Convert email to lowercase
        email = attrs.get("email", "").lower()
        attrs["username"] = email  # TokenObtainPairSerializer expects "username"

        # Let base class handle authentication & update_last_login
        data = super().validate(attrs)

        # Add user details to response
        data["user"] = UserSerializer(self.user).data

        # Add custom claims (already handled in get_token)
        return data


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user details.
    """

    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "is_verified",
            "is_active",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["id", "email", "role", "is_verified", "date_joined", "last_login"]


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile updates.
    """

    class Meta:
        model = User
        fields = ["first_name", "last_name"]


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change.
    """

    old_password = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    new_password_confirm = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )

    def validate_old_password(self, value):
        """Validate old password."""
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate(self, attrs):
        """Validate new passwords match and differ from old password."""

        # validate new password is different from old password
        if attrs["old_password"] == attrs["new_password"]:
            raise serializers.ValidationError(
                {"new_password": "New password must be different from old password."}
            )

        # validate new passwords match
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "New passwords do not match."}
            )
        return attrs

    def save(self):
        """Update user password."""
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for password reset request.
    """

    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        """Validate email exists."""
        if not User.objects.filter(email=value.lower()).exists():
            # Don't reveal if email exists or not for security
            pass
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for password reset confirmation.
    """

    token = serializers.CharField(required=True)
    uidb64 = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    new_password_confirm = serializers.CharField(
        required=True, write_only=True, style={"input_type": "password"}
    )

    def validate(self, attrs):
        """Validate new passwords match."""
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    """
    Serializer for email verification.
    """

    token = serializers.CharField(required=True)
    uidb64 = serializers.CharField(required=True)
