"""
Tests for grading API endpoints.
"""

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.assessments.models import Course, Exam, Question
from apps.grading.models import GradingConfiguration, GradingTask
from apps.submissions.models import Submission

User = get_user_model()


@pytest.fixture
def instructor():
    """Create an instructor user."""
    return User.objects.create_user(
        email="instructor@test.com",
        password="TestPass123!",
        role="instructor",
        first_name="Test",
        last_name="Instructor",
        is_verified=True,
    )


@pytest.fixture
def student():
    """Create a student user."""
    return User.objects.create_user(
        email="student@test.com",
        password="TestPass123!",
        role="student",
        first_name="Test",
        last_name="Student",
        is_verified=True,
    )


@pytest.fixture
def course(instructor):
    """Create a course."""
    return Course.objects.create(
        title="Test Course",
        code="CS101",
        description="Test course description",
        instructor=instructor,
    )


@pytest.fixture
def exam(course):
    """Create an exam."""
    return Exam.objects.create(
        course=course,
        title="Test Exam",
        description="Test exam description",
        total_marks=100,
        passing_marks=60,
        duration_minutes=60,
    )


@pytest.fixture
def question(exam):
    """Create a question."""
    return Question.objects.create(
        exam=exam,
        question_text="What is the capital of France?",
        question_type="short_answer",
        marks=10,
        reference_answer="Paris",
    )


@pytest.fixture
def submission(exam, student):
    """Create a submission."""
    return Submission.objects.create(
        exam=exam,
        student=student,
        status="submitted",
    )


@pytest.fixture
def grading_task(submission):
    """Create a grading task."""
    return GradingTask.objects.create(
        submission=submission,
        grading_method="openai",
        status="pending",
    )


@pytest.fixture
def grading_configuration(exam):
    """Create a grading configuration."""
    return GradingConfiguration.objects.create(
        scope="exam",
        exam=exam,
        grading_service="openai",
        service_config={
            "model": "gpt-4o-mini",
            "temperature": 0.3,
            "max_tokens": 500,
        },
        is_active=True,
    )


@pytest.mark.django_db
class TestGradingTaskListAPI:
    """Tests for grading task list API."""

    def test_instructor_can_list_tasks(self, instructor, grading_task):
        """Test instructor can list grading tasks for their courses."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:task-list")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1

    def test_student_cannot_list_tasks(self, student, grading_task):
        """Test student cannot list grading tasks."""
        client = APIClient()
        client.force_authenticate(user=student)

        url = reverse("grading:task-list")
        response = client.get(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_filter_by_status(self, instructor, grading_task):
        """Test filtering tasks by status."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:task-list")
        response = client.get(url, {"status": "pending"})

        assert response.status_code == status.HTTP_200_OK
        for task in response.data["results"]:
            assert task["status"] == "pending"

    def test_filter_by_method(self, instructor, grading_task):
        """Test filtering tasks by grading method."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:task-list")
        response = client.get(url, {"method": "openai"})

        assert response.status_code == status.HTTP_200_OK
        for task in response.data["results"]:
            assert task["grading_method"] == "openai"

    def test_unauthenticated_cannot_list_tasks(self, grading_task):
        """Test unauthenticated user cannot list tasks."""
        client = APIClient()

        url = reverse("grading:task-list")
        response = client.get(url)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestGradingTaskDetailAPI:
    """Tests for grading task detail API."""

    def test_instructor_can_retrieve_task(self, instructor, grading_task):
        """Test instructor can retrieve grading task details."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:task-detail", kwargs={"pk": grading_task.id})
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == grading_task.id
        assert response.data["grading_method"] == "openai"

    def test_task_includes_duration(self, instructor, grading_task):
        """Test task detail includes duration field."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:task-detail", kwargs={"pk": grading_task.id})
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "duration" in response.data


@pytest.mark.django_db
class TestGradingTaskStatisticsAPI:
    """Tests for grading task statistics API."""

    def test_get_statistics(self, instructor, grading_task):
        """Test getting grading task statistics."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:task-statistics")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "total" in response.data
        assert "pending" in response.data
        assert "in_progress" in response.data
        assert "completed" in response.data
        assert "failed" in response.data
        assert "by_method" in response.data

    def test_statistics_counts(self, instructor, submission):
        """Test statistics counts are accurate."""
        # Create tasks with different statuses
        GradingTask.objects.create(
            submission=submission,
            grading_method="openai",
            status="pending",
        )
        GradingTask.objects.create(
            submission=submission,
            grading_method="claude",
            status="completed",
        )
        GradingTask.objects.create(
            submission=submission,
            grading_method="gemini",
            status="failed",
        )

        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:task-statistics")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total"] == 3
        assert response.data["pending"] == 1
        assert response.data["completed"] == 1
        assert response.data["failed"] == 1


@pytest.mark.django_db
class TestGradingConfigurationAPI:
    """Tests for grading configuration API."""

    def test_instructor_can_list_configurations(self, instructor, grading_configuration):
        """Test instructor can list grading configurations."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-list")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1

    def test_instructor_can_create_configuration(self, instructor, exam):
        """Test instructor can create grading configuration."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-list")
        data = {
            "scope": "exam",
            "exam": exam.id,
            "grading_service": "claude",
            "service_config": {
                "model": "claude-3-5-sonnet-20241022",
                "temperature": 0.2,
                "max_tokens": 1024,
            },
            "is_active": True,
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["grading_service"] == "claude"

    def test_instructor_can_update_configuration(self, instructor, grading_configuration):
        """Test instructor can update grading configuration."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-detail", kwargs={"pk": grading_configuration.id})
        data = {
            "scope": "exam",
            "exam": grading_configuration.exam.id,
            "grading_service": "openai",
            "service_config": {
                "model": "gpt-4o",
                "temperature": 0.1,
                "max_tokens": 1000,
            },
            "is_active": True,
        }

        response = client.put(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["service_config"]["model"] == "gpt-4o"

    def test_instructor_can_delete_configuration(self, instructor, grading_configuration):
        """Test instructor can delete grading configuration."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-detail", kwargs={"pk": grading_configuration.id})
        response = client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not GradingConfiguration.objects.filter(id=grading_configuration.id).exists()

    def test_student_cannot_create_configuration(self, student, exam):
        """Test student cannot create grading configuration."""
        client = APIClient()
        client.force_authenticate(user=student)

        url = reverse("grading:configuration-list")
        data = {
            "scope": "exam",
            "exam": exam.id,
            "grading_service": "mock",
            "is_active": True,
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_filter_by_scope(self, instructor, grading_configuration):
        """Test filtering configurations by scope."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-list")
        response = client.get(url, {"scope": "exam"})

        assert response.status_code == status.HTTP_200_OK
        for config in response.data["results"]:
            assert config["scope"] == "exam"

    def test_filter_by_service(self, instructor, grading_configuration):
        """Test filtering configurations by service."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-list")
        response = client.get(url, {"service": "openai"})

        assert response.status_code == status.HTTP_200_OK
        for config in response.data["results"]:
            assert config["grading_service"] == "openai"


@pytest.mark.django_db
class TestGradingServicesInfoAPI:
    """Tests for grading services info API."""

    def test_get_services_info(self, instructor):
        """Test getting available grading services info."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-services")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 4  # mock, openai, claude, gemini

        # Check structure of service info
        service_names = [s["name"] for s in response.data]
        assert "mock" in service_names
        assert "openai" in service_names
        assert "claude" in service_names
        assert "gemini" in service_names

        # Check service details
        for service in response.data:
            assert "name" in service
            assert "display_name" in service
            assert "description" in service
            assert "requires_api_key" in service
            assert "supported_models" in service
            assert "default_model" in service
            assert "configuration_options" in service

    def test_services_info_includes_mock(self, instructor):
        """Test services info includes mock service."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-services")
        response = client.get(url)

        assert response.status_code == status.HTTP_200_OK

        mock_service = next((s for s in response.data if s["name"] == "mock"), None)
        assert mock_service is not None
        assert mock_service["requires_api_key"] is False


@pytest.mark.django_db
class TestBulkGradeAPI:
    """Tests for bulk grade API."""

    def test_instructor_can_bulk_grade(self, instructor, submission):
        """Test instructor can trigger bulk grading."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-bulk-grade")
        data = {
            "submission_ids": [submission.id],
            "force_regrade": False,
        }

        with patch("apps.grading.views.bulk_grade_submissions") as mock_task:
            mock_task.delay.return_value.id = "test-task-id"

            response = client.post(url, data, format="json")

            assert response.status_code == status.HTTP_200_OK
            assert "task_id" in response.data
            assert response.data["submission_count"] == 1
            mock_task.delay.assert_called_once_with([submission.id])

    def test_bulk_grade_validates_permissions(self, instructor, student, submission):
        """Test bulk grade validates instructor has permission for submissions."""
        # Create another instructor's submission
        other_instructor = User.objects.create_user(
            email="other@test.com",
            password="TestPass123!",
            role="instructor",
        )
        other_course = Course.objects.create(
            title="Other Course",
            code="CS102",
            instructor=other_instructor,
        )
        other_exam = Exam.objects.create(
            course=other_course,
            title="Other Exam",
            total_marks=100,
            passing_marks=60,
            duration_minutes=60,
        )
        other_submission = Submission.objects.create(
            exam=other_exam,
            student=student,
            status="submitted",
        )

        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-bulk-grade")
        data = {
            "submission_ids": [other_submission.id],
            "force_regrade": False,
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_bulk_grade_validates_limit(self, instructor, exam, student):
        """Test bulk grade enforces submission limit."""
        # Create 101 submissions
        submission_ids = []
        for i in range(101):
            s = Submission.objects.create(
                exam=exam,
                student=student,
                status="submitted",
            )
            submission_ids.append(s.id)

        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-bulk-grade")
        data = {
            "submission_ids": submission_ids,
            "force_regrade": False,
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_student_cannot_bulk_grade(self, student, submission):
        """Test student cannot trigger bulk grading."""
        client = APIClient()
        client.force_authenticate(user=student)

        url = reverse("grading:configuration-bulk-grade")
        data = {
            "submission_ids": [submission.id],
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestGradingConfigurationValidation:
    """Tests for grading configuration validation."""

    def test_global_scope_validation(self, instructor):
        """Test global scope cannot have exam or question."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-list")
        data = {
            "scope": "global",
            "grading_service": "mock",
            "is_active": True,
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED

    def test_exam_scope_requires_exam(self, instructor):
        """Test exam scope requires exam field."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-list")
        data = {
            "scope": "exam",
            "grading_service": "mock",
            "is_active": True,
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "exam" in response.data

    def test_invalid_grading_service(self, instructor, exam):
        """Test invalid grading service is rejected."""
        client = APIClient()
        client.force_authenticate(user=instructor)

        url = reverse("grading:configuration-list")
        data = {
            "scope": "exam",
            "exam": exam.id,
            "grading_service": "invalid_service",
            "is_active": True,
        }

        response = client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST


from unittest.mock import patch
