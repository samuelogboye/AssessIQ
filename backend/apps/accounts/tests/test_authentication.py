"""
Tests for authentication endpoints.
"""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
class TestUserRegistration:
    """Tests for user registration."""

    def test_register_student_success(self):
        """Test successful student registration."""
        client = APIClient()
        url = reverse("register")
        data = {
            "email": "student@test.com",
            "password": "TestPass123!",
            "password_confirm": "TestPass123!",
            "first_name": "Test",
            "last_name": "Student",
            "role": "student",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email="student@test.com").exists()

        user = User.objects.get(email="student@test.com")
        assert user.role == "student"
        assert user.first_name == "Test"
        assert not user.is_verified

    def test_register_password_mismatch(self):
        """Test registration with mismatched passwords."""
        client = APIClient()
        url = reverse("register")
        data = {
            "email": "student@test.com",
            "password": "TestPass123!",
            "password_confirm": "DifferentPass123!",
            "role": "student",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "detail" in response.data
        assert "password_confirm" in response.data["detail"]

    def test_register_duplicate_email(self):
        """Test registration with existing email."""
        User.objects.create_user(email="existing@test.com", password="TestPass123!")

        client = APIClient()
        url = reverse("register")
        data = {
            "email": "existing@test.com",
            "password": "TestPass123!",
            "password_confirm": "TestPass123!",
            "role": "student",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_weak_password(self):
        """Test registration with weak password."""
        client = APIClient()
        url = reverse("register")
        data = {
            "email": "student@test.com",
            "password": "123",
            "password_confirm": "123",
            "role": "student",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserLogin:
    """Tests for user login."""

    def test_login_success(self):
        """Test successful login."""
        user = User.objects.create_user(
            email="student@test.com", password="TestPass123!", role="student"
        )

        user.is_verified = True
        user.save()

        client = APIClient()
        url = reverse("login")
        data = {"email": "student@test.com", "password": "TestPass123!"}

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data
        assert "user" in response.data
        assert response.data["user"]["email"] == "student@test.com"

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        User.objects.create_user(email="student@test.com", password="TestPass123!")

        client = APIClient()
        url = reverse("login")
        data = {"email": "student@test.com", "password": "WrongPassword"}

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_inactive_user(self):
        """Test login with inactive user."""
        user = User.objects.create_user(email="student@test.com", password="TestPass123!")
        user.is_active = False
        user.save()

        client = APIClient()
        url = reverse("login")
        data = {"email": "student@test.com", "password": "TestPass123!"}

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUserProfile:
    """Tests for user profile endpoints."""

    def test_get_profile_authenticated(self):
        """Test getting profile when authenticated."""
        user = User.objects.create_user(
            email="student@test.com",
            password="TestPass123!",
            first_name="Test",
            last_name="Student",
        )

        client = APIClient()
        client.force_authenticate(user=user)
        url = reverse("profile")

        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["email"] == "student@test.com"
        assert response.data["first_name"] == "Test"

    def test_get_profile_unauthenticated(self):
        """Test getting profile when not authenticated."""
        client = APIClient()
        url = reverse("profile")

        response = client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_profile(self):
        """Test updating profile."""
        user = User.objects.create_user(
            email="student@test.com",
            password="TestPass123!",
            first_name="Test",
            last_name="Student",
        )

        client = APIClient()
        client.force_authenticate(user=user)
        url = reverse("profile")

        data = {"first_name": "Updated", "last_name": "Name"}

        response = client.patch(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

        user.refresh_from_db()
        assert user.first_name == "Updated"
        assert user.last_name == "Name"


@pytest.mark.django_db
class TestChangePassword:
    """Tests for password change."""

    def test_change_password_success(self):
        """Test successful password change."""
        user = User.objects.create_user(email="student@test.com", password="OldPassword123!")

        client = APIClient()
        client.force_authenticate(user=user)
        url = reverse("change_password")

        data = {
            "old_password": "OldPassword123!",
            "new_password": "NewPassword123!",
            "new_password_confirm": "NewPassword123!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK

        user.refresh_from_db()
        assert user.check_password("NewPassword123!")

    def test_change_password_wrong_old_password(self):
        """Test password change with wrong old password."""
        user = User.objects.create_user(email="student@test.com", password="OldPassword123!")

        client = APIClient()
        client.force_authenticate(user=user)
        url = reverse("change_password")

        data = {
            "old_password": "WrongPassword",
            "new_password": "NewPassword123!",
            "new_password_confirm": "NewPassword123!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_change_password_mismatch(self):
        """Test password change with mismatched new passwords."""
        user = User.objects.create_user(email="student@test.com", password="OldPassword123!")

        client = APIClient()
        client.force_authenticate(user=user)
        url = reverse("change_password")

        data = {
            "old_password": "OldPassword123!",
            "new_password": "NewPassword123!",
            "new_password_confirm": "DifferentPassword123!",
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
