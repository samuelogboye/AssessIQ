"""
API tests for assessments app.
"""

from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.assessments.models import Course, Exam, Question

User = get_user_model()


@pytest.fixture
def api_client():
    """Create API client."""
    return APIClient()


@pytest.fixture
def instructor(db):
    """Create instructor user."""
    return User.objects.create_user(
        email="instructor@test.com",
        password="TestPass123!",
        role="instructor",
        is_verified=True,
    )


@pytest.fixture
def student(db):
    """Create student user."""
    return User.objects.create_user(
        email="student@test.com",
        password="TestPass123!",
        role="student",
        is_verified=True,
    )


@pytest.fixture
def course(instructor):
    """Create a test course."""
    return Course.objects.create(
        code="CS101",
        name="Introduction to Computer Science",
        description="Basic CS course",
        instructor=instructor,
        is_active=True,
    )


@pytest.fixture
def exam(course):
    """Create a test exam."""
    return Exam.objects.create(
        title="Midterm Exam",
        description="First midterm",
        course=course,
        duration_minutes=90,
        total_marks=100,
        passing_marks=60,
        status="published",
        start_time=timezone.now() - timedelta(hours=1),
        end_time=timezone.now() + timedelta(hours=2),
        max_attempts=2,
    )


@pytest.fixture
def questions(exam):
    """Create test questions."""
    return [
        Question.objects.create(
            exam=exam,
            question_number=1,
            question_type="multiple_choice",
            question_text="What is 2+2?",
            marks=10,
            options=["3", "4", "5"],
            correct_answer="4",
        ),
        Question.objects.create(
            exam=exam,
            question_number=2,
            question_type="short_answer",
            question_text="Explain inheritance.",
            marks=20,
            keywords=["class", "inherit", "parent", "child"],
            keyword_weight=0.7,
        ),
    ]


@pytest.mark.django_db
class TestCourseAPI:
    """Tests for Course API endpoints."""

    def test_list_courses_as_instructor(self, api_client, instructor, course):
        """Test instructor can list their courses."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:course-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["code"] == "CS101"

    def test_list_courses_as_student(self, api_client, student, course):
        """Test student can only see active courses."""
        api_client.force_authenticate(user=student)
        url = reverse("assessments:course-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

        # Make course inactive
        course.is_active = False
        course.save()

        response = api_client.get(url)
        assert len(response.data["results"]) == 0

    def test_create_course_as_instructor(self, api_client, instructor):
        """Test instructor can create course."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:course-list")
        data = {
            "code": "CS102",
            "name": "Data Structures",
            "description": "Advanced topics",
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert Course.objects.filter(code="CS102").exists()

    def test_create_course_as_student_forbidden(self, api_client, student):
        """Test student cannot create course."""
        api_client.force_authenticate(user=student)
        url = reverse("assessments:course-list")
        data = {
            "code": "CS102",
            "name": "Data Structures",
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_course(self, api_client, instructor, course):
        """Test instructor can update their course."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:course-detail", kwargs={"pk": course.pk})
        data = {
            "code": "CS101",
            "name": "Updated Course Name",
            "description": course.description,
        }
        response = api_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK
        course.refresh_from_db()
        assert course.name == "Updated Course Name"

    def test_toggle_course_active(self, api_client, instructor, course):
        """Test toggling course active status."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:course-toggle-active", kwargs={"pk": course.pk})
        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        course.refresh_from_db()
        assert course.is_active is False

    def test_get_course_exams(self, api_client, instructor, course, exam):
        """Test getting exams for a course."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:course-exams", kwargs={"pk": course.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1


@pytest.mark.django_db
class TestExamAPI:
    """Tests for Exam API endpoints."""

    def test_list_exams_as_instructor(self, api_client, instructor, exam):
        """Test instructor can list their exams."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:exam-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

    def test_create_exam(self, api_client, instructor, course):
        """Test instructor can create exam."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:exam-list")
        data = {
            "title": "Final Exam",
            "description": "End of semester exam",
            "course": course.id,
            "duration_minutes": 120,
            "total_marks": 100,
            "passing_marks": 50,
            "status": "draft",
            "max_attempts": 1,
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert Exam.objects.filter(title="Final Exam").exists()

    def test_create_exam_with_questions(self, api_client, instructor, course):
        """Test creating exam with nested questions."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:exam-list")
        data = {
            "title": "Quiz 1",
            "course": course.id,
            "duration_minutes": 30,
            "total_marks": 30,
            "passing_marks": 20,
            "status": "draft",
            "max_attempts": 1,
            "questions": [
                {
                    "question_type": "multiple_choice",
                    "question_text": "What is Python?",
                    "marks": 10,
                    "options": ["Language", "Snake", "Framework"],
                    "correct_answer": "Language",
                },
                {
                    "question_type": "true_false",
                    "question_text": "Python is compiled.",
                    "marks": 10,
                    "correct_answer": "false",
                },
                {
                    "question_type": "short_answer",
                    "question_text": "Explain OOP.",
                    "marks": 10,
                    "keywords": ["object", "class", "inheritance"],
                },
            ],
        }
        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        exam = Exam.objects.get(title="Quiz 1")
        assert exam.questions.count() == 3

    def test_publish_exam(self, api_client, instructor, exam, questions):
        """Test publishing an exam."""
        exam.status = "draft"
        exam.save()

        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:exam-publish", kwargs={"pk": exam.pk})
        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        exam.refresh_from_db()
        assert exam.status == "published"

    def test_publish_exam_without_questions_fails(self, api_client, instructor):
        """Test cannot publish exam without questions."""
        exam = Exam.objects.create(
            title="Empty Exam",
            course=Course.objects.create(
                code="CS999",
                name="Test",
                instructor=instructor,
            ),
            duration_minutes=60,
            total_marks=100,
            passing_marks=50,
            status="draft",
        )

        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:exam-publish", kwargs={"pk": exam.pk})
        response = api_client.post(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_archive_exam(self, api_client, instructor, exam):
        """Test archiving an exam."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:exam-archive", kwargs={"pk": exam.pk})
        response = api_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        exam.refresh_from_db()
        assert exam.status == "archived"

    def test_exam_statistics(self, api_client, instructor, exam):
        """Test getting exam statistics."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:exam-statistics", kwargs={"pk": exam.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "total_submissions" in response.data
        assert "average_score" in response.data


@pytest.mark.django_db
class TestStudentExamAPI:
    """Tests for Student Exam API endpoints."""

    def test_list_available_exams(self, api_client, student, exam):
        """Test student can list available exams."""
        api_client.force_authenticate(user=student)
        url = reverse("assessments:student-exam-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

    def test_student_cannot_see_draft_exams(self, api_client, student, exam):
        """Test student cannot see draft exams."""
        exam.status = "draft"
        exam.save()

        api_client.force_authenticate(user=student)
        url = reverse("assessments:student-exam-list")
        response = api_client.get(url)

        assert len(response.data["results"]) == 0

    def test_student_cannot_see_inactive_course_exams(self, api_client, student, exam):
        """Test student cannot see exams from inactive courses."""
        exam.course.is_active = False
        exam.course.save()

        api_client.force_authenticate(user=student)
        url = reverse("assessments:student-exam-list")
        response = api_client.get(url)

        assert len(response.data["results"]) == 0

    def test_check_can_attempt(self, api_client, student, exam):
        """Test checking if student can attempt exam."""
        api_client.force_authenticate(user=student)
        url = reverse("assessments:student-exam-can-attempt", kwargs={"pk": exam.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["can_attempt"] is True
        assert response.data["attempts_remaining"] == 2


@pytest.mark.django_db
class TestQuestionAPI:
    """Tests for Question API endpoints."""

    def test_list_questions(self, api_client, instructor, questions):
        """Test instructor can list questions."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:question-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 2

    def test_filter_questions_by_exam(self, api_client, instructor, exam, questions):
        """Test filtering questions by exam."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:question-list") + f"?exam={exam.id}"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 2

    def test_create_question(self, api_client, instructor, exam):
        """Test instructor can create question."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:question-list")
        data = {
            "exam": exam.id,
            "question_number": 3,
            "question_type": "essay",
            "question_text": "Discuss design patterns.",
            "marks": 30,
            "use_ai_grading": True,
        }
        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert Question.objects.filter(question_number=3).exists()

    def test_bulk_create_questions(self, api_client, instructor, exam):
        """Test bulk creating questions."""
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:question-bulk-create")
        data = {
            "exam_id": exam.id,
            "questions": [
                {
                    "question_type": "multiple_choice",
                    "question_text": "Question 1",
                    "marks": 5,
                    "options": ["A", "B", "C"],
                    "correct_answer": "A",
                },
                {
                    "question_type": "multiple_choice",
                    "question_text": "Question 2",
                    "marks": 5,
                    "options": ["X", "Y", "Z"],
                    "correct_answer": "Y",
                },
            ],
        }
        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["created"] == 2

    def test_update_question(self, api_client, instructor, questions):
        """Test instructor can update question."""
        question = questions[0]
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:question-detail", kwargs={"pk": question.pk})
        data = {
            "question_text": "Updated question text",
        }
        response = api_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK
        question.refresh_from_db()
        assert question.question_text == "Updated question text"

    def test_delete_question(self, api_client, instructor, questions):
        """Test instructor can delete question."""
        question = questions[0]
        api_client.force_authenticate(user=instructor)
        url = reverse("assessments:question-detail", kwargs={"pk": question.pk})
        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Question.objects.filter(pk=question.pk).exists()
