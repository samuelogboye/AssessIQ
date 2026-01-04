"""
Tests for custom permissions.
"""

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from apps.assessments.models import Course, Exam
from apps.core.permissions import (
    CanSubmitExam,
    CanViewSubmission,
    IsInstructor,
    IsStudent,
    IsVerifiedUser,
)
from apps.submissions.models import Submission

User = get_user_model()


@pytest.mark.django_db
class TestRolePermissions:
    """Tests for role-based permissions."""

    def test_is_student_permission(self):
        """Test IsStudent permission."""
        student = User.objects.create_user(
            email="student@test.com", password="test123", role="student"
        )
        instructor = User.objects.create_user(
            email="instructor@test.com", password="test123", role="instructor"
        )

        factory = APIRequestFactory()
        request = factory.get("/")

        permission = IsStudent()

        # Student should have permission
        request.user = student
        assert permission.has_permission(request, None)

        # Instructor should not
        request.user = instructor
        assert not permission.has_permission(request, None)

    def test_is_instructor_permission(self):
        """Test IsInstructor permission."""
        student = User.objects.create_user(
            email="student@test.com", password="test123", role="student"
        )
        instructor = User.objects.create_user(
            email="instructor@test.com", password="test123", role="instructor"
        )

        factory = APIRequestFactory()
        request = factory.get("/")

        permission = IsInstructor()

        # Instructor should have permission
        request.user = instructor
        assert permission.has_permission(request, None)

        # Student should not
        request.user = student
        assert not permission.has_permission(request, None)


@pytest.mark.django_db
class TestVerifiedUserPermission:
    """Tests for IsVerifiedUser permission."""

    def test_verified_user_has_permission(self):
        """Test verified user has permission."""
        user = User.objects.create_user(email="user@test.com", password="test123", is_verified=True)

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = user

        permission = IsVerifiedUser()
        assert permission.has_permission(request, None)

    def test_unverified_user_no_permission(self):
        """Test unverified user does not have permission."""
        user = User.objects.create_user(
            email="user@test.com", password="test123", is_verified=False
        )

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = user

        permission = IsVerifiedUser()
        assert not permission.has_permission(request, None)


@pytest.mark.django_db
class TestCanSubmitExamPermission:
    """Tests for CanSubmitExam permission."""

    def test_can_submit_published_exam(self):
        """Test student can submit published exam within window."""
        student = User.objects.create_user(
            email="student@test.com", password="test123", role="student"
        )
        instructor = User.objects.create_user(
            email="instructor@test.com", password="test123", role="instructor"
        )
        course = Course.objects.create(code="CS101", name="Test Course", instructor=instructor)
        exam = Exam.objects.create(
            title="Test Exam",
            course=course,
            duration_minutes=60,
            total_marks=100,
            status="published",
            start_time=timezone.now() - timedelta(hours=1),
            end_time=timezone.now() + timedelta(hours=1),
            max_attempts=3,
        )

        factory = APIRequestFactory()
        request = factory.post("/")
        request.user = student

        permission = CanSubmitExam()
        assert permission.has_object_permission(request, None, exam)

    def test_cannot_submit_draft_exam(self):
        """Test student cannot submit draft exam."""
        student = User.objects.create_user(
            email="student@test.com", password="test123", role="student"
        )
        instructor = User.objects.create_user(
            email="instructor@test.com", password="test123", role="instructor"
        )
        course = Course.objects.create(code="CS101", name="Test Course", instructor=instructor)
        exam = Exam.objects.create(
            title="Test Exam", course=course, duration_minutes=60, total_marks=100, status="draft"
        )

        factory = APIRequestFactory()
        request = factory.post("/")
        request.user = student

        permission = CanSubmitExam()
        assert not permission.has_object_permission(request, None, exam)

    def test_cannot_submit_expired_exam(self):
        """Test student cannot submit expired exam."""
        student = User.objects.create_user(
            email="student@test.com", password="test123", role="student"
        )
        instructor = User.objects.create_user(
            email="instructor@test.com", password="test123", role="instructor"
        )
        course = Course.objects.create(code="CS101", name="Test Course", instructor=instructor)
        exam = Exam.objects.create(
            title="Test Exam",
            course=course,
            duration_minutes=60,
            total_marks=100,
            status="published",
            start_time=timezone.now() - timedelta(hours=2),
            end_time=timezone.now() - timedelta(hours=1),
        )

        factory = APIRequestFactory()
        request = factory.post("/")
        request.user = student

        permission = CanSubmitExam()
        assert not permission.has_object_permission(request, None, exam)


@pytest.mark.django_db
class TestCanViewSubmissionPermission:
    """Tests for CanViewSubmission permission."""

    def test_student_can_view_own_submission(self):
        """Test student can view their own submission."""
        student = User.objects.create_user(
            email="student@test.com", password="test123", role="student"
        )
        instructor = User.objects.create_user(
            email="instructor@test.com", password="test123", role="instructor"
        )
        course = Course.objects.create(code="CS101", name="Test Course", instructor=instructor)
        exam = Exam.objects.create(
            title="Test Exam", course=course, duration_minutes=60, total_marks=100
        )
        submission = Submission.objects.create(student=student, exam=exam)

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = student

        permission = CanViewSubmission()
        assert permission.has_object_permission(request, None, submission)

    def test_student_cannot_view_other_submission(self):
        """Test student cannot view another student's submission."""
        student1 = User.objects.create_user(
            email="student1@test.com", password="test123", role="student"
        )
        student2 = User.objects.create_user(
            email="student2@test.com", password="test123", role="student"
        )
        instructor = User.objects.create_user(
            email="instructor@test.com", password="test123", role="instructor"
        )
        course = Course.objects.create(code="CS101", name="Test Course", instructor=instructor)
        exam = Exam.objects.create(
            title="Test Exam", course=course, duration_minutes=60, total_marks=100
        )
        submission = Submission.objects.create(student=student1, exam=exam)

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = student2

        permission = CanViewSubmission()
        assert not permission.has_object_permission(request, None, submission)

    def test_instructor_can_view_course_submission(self):
        """Test instructor can view submissions for their course."""
        student = User.objects.create_user(
            email="student@test.com", password="test123", role="student"
        )
        instructor = User.objects.create_user(
            email="instructor@test.com", password="test123", role="instructor"
        )
        course = Course.objects.create(code="CS101", name="Test Course", instructor=instructor)
        exam = Exam.objects.create(
            title="Test Exam", course=course, duration_minutes=60, total_marks=100
        )
        submission = Submission.objects.create(student=student, exam=exam)

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = instructor

        permission = CanViewSubmission()
        assert permission.has_object_permission(request, None, submission)
