"""
API tests for submissions app.
"""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from apps.assessments.models import Course, Exam, Question
from apps.submissions.models import Submission, SubmissionAnswer

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
def another_student(db):
    """Create another student user."""
    return User.objects.create_user(
        email="student2@test.com",
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
        instructor=instructor,
        is_active=True,
    )


@pytest.fixture
def exam(course):
    """Create a test exam."""
    return Exam.objects.create(
        title="Midterm Exam",
        course=course,
        duration_minutes=90,
        total_marks=30,
        passing_marks=18,
        status="published",
        start_time=timezone.now() - timedelta(hours=1),
        end_time=timezone.now() + timedelta(hours=2),
        max_attempts=2,
        allow_review=True,
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
            question_type="true_false",
            question_text="Python is compiled.",
            marks=10,
            correct_answer="false",
        ),
        Question.objects.create(
            exam=exam,
            question_number=3,
            question_type="short_answer",
            question_text="Explain OOP.",
            marks=10,
            keywords=["object", "class", "inheritance"],
            keyword_weight=0.7,
        ),
    ]


@pytest.fixture
def submission(student, exam):
    """Create a test submission."""
    return Submission.objects.create(
        student=student,
        exam=exam,
        attempt_number=1,
        status="in_progress",
    )


@pytest.fixture
def submitted_submission(student, exam, questions):
    """Create a submitted submission with answers."""
    sub = Submission.objects.create(
        student=student,
        exam=exam,
        attempt_number=1,
        status="submitted",
        submitted_at=timezone.now(),
    )

    # Create answers
    SubmissionAnswer.objects.create(
        submission=sub,
        question=questions[0],
        answer_text="4",
        score=10,
        graded_by="auto",
    )
    SubmissionAnswer.objects.create(
        submission=sub,
        question=questions[1],
        answer_text="false",
        score=10,
        graded_by="auto",
    )
    SubmissionAnswer.objects.create(
        submission=sub,
        question=questions[2],
        answer_text="Object-oriented programming uses classes and inheritance.",
        score=None,
    )

    return sub


@pytest.mark.django_db
class TestSubmissionAPI:
    """Tests for Submission API endpoints."""

    def test_create_submission(self, api_client, student, exam):
        """Test student can create submission."""
        api_client.force_authenticate(user=student)
        url = reverse("submissions:submission-list")
        data = {
            "exam_id": exam.id,
            "ip_address": "127.0.0.1",
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert Submission.objects.filter(student=student, exam=exam).exists()

    def test_create_submission_validates_max_attempts(self, api_client, student, exam):
        """Test cannot create submission after max attempts."""
        # Create max attempts
        for i in range(exam.max_attempts):
            Submission.objects.create(
                student=student,
                exam=exam,
                attempt_number=i + 1,
                status="submitted",
            )

        api_client.force_authenticate(user=student)
        url = reverse("submissions:submission-list")
        data = {"exam_id": exam.id}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "maximum number of attempts" in str(response.data).lower()

    def test_create_submission_validates_in_progress(self, api_client, student, exam):
        """Test cannot create submission if one is in progress."""
        Submission.objects.create(
            student=student,
            exam=exam,
            attempt_number=1,
            status="in_progress",
        )

        api_client.force_authenticate(user=student)
        url = reverse("submissions:submission-list")
        data = {"exam_id": exam.id}
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_submissions_as_student(self, api_client, student, another_student, exam):
        """Test student only sees their own submissions."""
        sub1 = Submission.objects.create(student=student, exam=exam, attempt_number=1)
        sub2 = Submission.objects.create(student=another_student, exam=exam, attempt_number=1)

        api_client.force_authenticate(user=student)
        url = reverse("submissions:submission-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["id"] == sub1.id

    def test_list_submissions_as_instructor(self, api_client, instructor, student, exam):
        """Test instructor sees all submissions for their courses."""
        Submission.objects.create(student=student, exam=exam, attempt_number=1)

        api_client.force_authenticate(user=instructor)
        url = reverse("submissions:submission-list")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

    def test_save_answer(self, api_client, student, submission, questions):
        """Test saving individual answer."""
        api_client.force_authenticate(user=student)
        url = reverse("submissions:submission-save-answer", kwargs={"pk": submission.pk})
        data = {
            "question_id": questions[0].id,
            "answer_text": "4",
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert SubmissionAnswer.objects.filter(
            submission=submission, question=questions[0]
        ).exists()

    def test_save_answer_validates_ownership(
        self, api_client, another_student, submission, questions
    ):
        """Test student cannot save answer for another's submission."""
        api_client.force_authenticate(user=another_student)
        url = reverse("submissions:submission-save-answer", kwargs={"pk": submission.pk})
        data = {
            "question_id": questions[0].id,
            "answer_text": "4",
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_submit_answers(self, api_client, student, submission, questions):
        """Test submitting all answers at once."""
        api_client.force_authenticate(user=student)
        url = reverse("submissions:submission-submit-answers", kwargs={"pk": submission.pk})
        data = {
            "answers": [
                {"question_id": questions[0].id, "answer_text": "4"},
                {"question_id": questions[1].id, "answer_text": "false"},
                {
                    "question_id": questions[2].id,
                    "answer_text": "OOP uses classes and objects.",
                },
            ]
        }
        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        submission.refresh_from_db()
        assert submission.status == "submitted"
        assert submission.answers.count() == 3

    def test_submit_answers_validates_questions(self, api_client, student, submission, exam):
        """Test submit answers validates questions belong to exam."""
        # Create question from different exam
        other_exam = Exam.objects.create(
            title="Other Exam",
            course=exam.course,
            duration_minutes=60,
            total_marks=50,
            passing_marks=25,
        )
        other_question = Question.objects.create(
            exam=other_exam,
            question_number=1,
            question_type="multiple_choice",
            question_text="Other question",
            marks=10,
        )

        api_client.force_authenticate(user=student)
        url = reverse("submissions:submission-submit-answers", kwargs={"pk": submission.pk})
        data = {
            "answers": [
                {"question_id": other_question.id, "answer_text": "answer"},
            ]
        }
        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_grade_answer(self, api_client, instructor, submitted_submission, questions):
        """Test instructor can manually grade answer."""
        answer = submitted_submission.answers.filter(score__isnull=True).first()

        api_client.force_authenticate(user=instructor)
        url = reverse(
            "submissions:submission-grade-answer",
            kwargs={"pk": submitted_submission.pk, "answer_id": answer.id},
        )
        data = {
            "score": 7.5,
            "feedback": "Good answer, but could be more detailed.",
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        answer.refresh_from_db()
        assert answer.score == 7.5
        assert answer.graded_by == "manual"

    def test_grade_answer_validates_score(
        self, api_client, instructor, submitted_submission, questions
    ):
        """Test grading validates score doesn't exceed question marks."""
        answer = submitted_submission.answers.filter(score__isnull=True).first()

        api_client.force_authenticate(user=instructor)
        url = reverse(
            "submissions:submission-grade-answer",
            kwargs={"pk": submitted_submission.pk, "answer_id": answer.id},
        )
        data = {
            "score": 20,  # Question is worth 10 marks
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_bulk_grade(self, api_client, instructor, submitted_submission):
        """Test bulk grading multiple answers."""
        answers = list(submitted_submission.answers.filter(score__isnull=True))

        api_client.force_authenticate(user=instructor)
        url = reverse("submissions:submission-bulk-grade", kwargs={"pk": submitted_submission.pk})
        data = {
            "grades": [
                {
                    "answer_id": answers[0].id,
                    "score": 8,
                    "feedback": "Good",
                }
            ]
        }
        response = api_client.post(url, data, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["graded"] == 1

    def test_pending_grading_list(self, api_client, instructor, student, exam, questions):
        """Test instructor can get pending grading submissions."""
        # Create submitted submission
        Submission.objects.create(
            student=student,
            exam=exam,
            attempt_number=1,
            status="submitted",
        )

        api_client.force_authenticate(user=instructor)
        url = reverse("submissions:submission-pending-grading")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_submission_review(self, api_client, student, submitted_submission):
        """Test student can review their submission."""
        api_client.force_authenticate(user=student)
        url = reverse("submissions:submission-review", kwargs={"pk": submitted_submission.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "answers" in response.data

    def test_filter_submissions_by_status(self, api_client, instructor, student, exam):
        """Test filtering submissions by status."""
        Submission.objects.create(
            student=student, exam=exam, attempt_number=1, status="in_progress"
        )
        Submission.objects.create(student=student, exam=exam, attempt_number=2, status="submitted")

        api_client.force_authenticate(user=instructor)
        url = reverse("submissions:submission-list") + "?status=submitted"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["status"] == "submitted"

    def test_filter_submissions_by_exam(self, api_client, instructor, student, course):
        """Test filtering submissions by exam."""
        exam1 = Exam.objects.create(
            title="Exam 1",
            course=course,
            duration_minutes=60,
            total_marks=100,
            passing_marks=50,
            status="published",
        )
        exam2 = Exam.objects.create(
            title="Exam 2",
            course=course,
            duration_minutes=60,
            total_marks=100,
            passing_marks=50,
            status="published",
        )

        Submission.objects.create(student=student, exam=exam1, attempt_number=1)
        Submission.objects.create(student=student, exam=exam2, attempt_number=1)

        api_client.force_authenticate(user=instructor)
        url = reverse("submissions:submission-list") + f"?exam={exam1.id}"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1


@pytest.mark.django_db
class TestSubmissionAnswerAPI:
    """Tests for SubmissionAnswer API endpoints."""

    def test_list_answers(self, api_client, student, submitted_submission):
        """Test listing submission answers."""
        api_client.force_authenticate(user=student)
        url = reverse("submissions:answer-list") + f"?submission={submitted_submission.id}"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 3

    def test_filter_ungraded_answers(self, api_client, instructor, submitted_submission):
        """Test filtering ungraded answers."""
        api_client.force_authenticate(user=instructor)
        url = reverse("submissions:answer-list") + "?ungraded=true"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert all(item["score"] is None for item in response.data["results"])

    def test_filter_answers_needing_review(self, api_client, instructor, submitted_submission):
        """Test filtering answers needing manual review."""
        answer = submitted_submission.answers.first()
        answer.requires_manual_review = True
        answer.save()

        api_client.force_authenticate(user=instructor)
        url = reverse("submissions:answer-list") + "?needs_review=true"
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) >= 1

    def test_grade_individual_answer(self, api_client, instructor, submitted_submission):
        """Test grading individual answer."""
        answer = submitted_submission.answers.filter(score__isnull=True).first()

        api_client.force_authenticate(user=instructor)
        url = reverse("submissions:answer-grade", kwargs={"pk": answer.pk})
        data = {
            "score": 9,
            "feedback": "Excellent work!",
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        answer.refresh_from_db()
        assert answer.score == 9
        assert answer.feedback == "Excellent work!"
