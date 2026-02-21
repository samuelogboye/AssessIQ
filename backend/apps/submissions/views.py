"""
Views for submissions app.
"""

from django.db.models import Avg
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.assessments.models import Exam
from apps.core.permissions import CanGradeSubmission, CanViewSubmission, IsStudent

from .models import Submission, SubmissionAnswer
from .serializers import (
    SubmissionAnswerCreateSerializer,
    SubmissionAnswerDetailSerializer,
    SubmissionAnswerSerializer,
    SubmissionAnswerStudentSerializer,
    SubmissionCreateSerializer,
    SubmissionGradeSerializer,
    SubmissionListSerializer,
    SubmissionSerializer,
    SubmissionStudentSerializer,
)


@extend_schema(tags=["Submissions"])
class SubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Submission model.
    Students can create and view their own submissions.
    Instructors can view and grade submissions for their courses.
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["student__email", "exam__title", "exam__course__name"]
    ordering_fields = ["started_at", "submitted_at", "total_score", "status"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "create":
            return SubmissionCreateSerializer
        elif self.action == "list":
            return SubmissionListSerializer
        elif self.request.user.role == "student":
            return SubmissionStudentSerializer
        return SubmissionSerializer

    def get_queryset(self):
        """
        Filter submissions based on user role.
        Students see only their own submissions.
        Instructors see submissions for their courses.
        """
        user = self.request.user
        queryset = Submission.objects.select_related(
            "student", "exam", "exam__course", "exam__course__instructor"
        ).prefetch_related("answers", "answers__question")

        if user.role == "student":
            # Students only see their own submissions
            queryset = queryset.filter(student=user)
        elif user.role == "instructor":
            # Instructors see submissions for their courses
            queryset = queryset.filter(exam__course__instructor=user)

        # Filter by status
        submission_status = self.request.query_params.get("status")
        if submission_status:
            queryset = queryset.filter(status=submission_status)

        # Filter by exam
        exam_id = self.request.query_params.get("exam")
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)

        # Filter by student (instructors only)
        if user.role == "instructor":
            student_id = self.request.query_params.get("student")
            if student_id:
                queryset = queryset.filter(student_id=student_id)

        # Filter by grading status
        pending_grading = self.request.query_params.get("pending_grading")
        if pending_grading and pending_grading.lower() in ["true", "1", "yes"]:
            queryset = queryset.filter(status="submitted")

        return queryset

    def get_permissions(self):
        """
        Set permissions based on action.
        """
        if self.action in ["retrieve", "list"]:
            permission_classes = [IsAuthenticated, CanViewSubmission]
        elif self.action == "create":
            permission_classes = [IsAuthenticated, IsStudent]
        elif self.action in ["grade_answer", "bulk_grade", "auto_grade"]:
            permission_classes = [IsAuthenticated, CanGradeSubmission]
        else:
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """Create submission for the current user."""
        serializer.save(student=self.request.user)

    @action(detail=True, methods=["post"])
    def submit_answers(self, request, pk=None):
        """Submit answers for a submission."""
        submission = self.get_object()

        # Validate student owns the submission
        if submission.student != request.user:
            return Response(
                {"detail": "You can only submit answers for your own submission."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Validate submission is in progress
        if submission.status != "in_progress":
            return Response(
                {"detail": "This submission has already been submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate and save answers
        serializer = SubmissionAnswerCreateSerializer(
            data=request.data, context={"submission": submission}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Return updated submission
        response_serializer = SubmissionStudentSerializer(submission)
        return Response(response_serializer.data)

    @action(detail=True, methods=["post"])
    def save_answer(self, request, pk=None):
        """Save or update a single answer without submitting."""
        submission = self.get_object()

        # Validate student owns the submission
        if submission.student != request.user:
            return Response(
                {"detail": "You can only save answers for your own submission."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Validate submission is in progress
        if submission.status != "in_progress":
            return Response(
                {"detail": "Cannot modify a submitted submission."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        question_id = request.data.get("question_id")
        answer_text = request.data.get("answer_text")

        if not question_id or answer_text is None:
            return Response(
                {"detail": "question_id and answer_text are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate question belongs to exam
        if not submission.exam.questions.filter(id=question_id).exists():
            return Response(
                {"detail": "Question does not belong to this exam."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create or update answer
        answer, created = SubmissionAnswer.objects.update_or_create(
            submission=submission,
            question_id=question_id,
            defaults={"answer_text": answer_text},
        )

        serializer = SubmissionAnswerStudentSerializer(answer)
        return Response(
            {
                "message": "Answer saved successfully.",
                "answer": serializer.data,
                "created": created,
            }
        )

    @action(detail=True, methods=["post"])
    def auto_grade(self, request, pk=None):
        """Trigger auto-grading for a submission."""
        from apps.grading.tasks import grade_submission

        submission = self.get_object()

        # Validate submission is submitted
        if submission.status != "submitted":
            return Response(
                {"detail": "Only submitted submissions can be graded."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Trigger async grading
        task = grade_submission.delay(submission.id)

        return Response(
            {
                "message": "Auto-grading initiated.",
                "task_id": task.id,
            }
        )

    @action(detail=True, methods=["post"], url_path="answers/(?P<answer_id>[^/.]+)/grade")
    def grade_answer(self, request, pk=None, answer_id=None):
        """Manually grade a specific answer."""
        submission = self.get_object()

        # Get the answer
        answer = get_object_or_404(SubmissionAnswer, id=answer_id, submission=submission)

        # Validate and save grade
        serializer = SubmissionGradeSerializer(data=request.data, context={"answer": answer})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Return updated answer
        response_serializer = SubmissionAnswerDetailSerializer(answer)
        return Response(response_serializer.data)

    @action(detail=True, methods=["post"])
    def bulk_grade(self, request, pk=None):
        """Grade multiple answers at once."""
        submission = self.get_object()
        grades = request.data.get("grades", [])

        if not grades:
            return Response(
                {"detail": "No grades provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = []
        errors = []

        for grade_data in grades:
            answer_id = grade_data.get("answer_id")
            if not answer_id:
                errors.append({"error": "answer_id is required", "data": grade_data})
                continue

            try:
                answer = SubmissionAnswer.objects.get(id=answer_id, submission=submission)
            except SubmissionAnswer.DoesNotExist:
                errors.append({"answer_id": answer_id, "error": "Answer not found"})
                continue

            serializer = SubmissionGradeSerializer(data=grade_data, context={"answer": answer})
            if serializer.is_valid():
                serializer.save()
                results.append({"answer_id": answer_id, "status": "graded"})
            else:
                errors.append({"answer_id": answer_id, "errors": serializer.errors})

        return Response(
            {
                "graded": len(results),
                "results": results,
                "errors": errors,
            }
        )

    @action(detail=False, methods=["get"])
    def pending_grading(self, request):
        """Get all submissions pending grading (instructors only)."""
        if request.user.role != "instructor":
            return Response(
                {"detail": "Only instructors can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )

        submissions = (
            Submission.objects.filter(status="submitted", exam__course__instructor=request.user)
            .select_related("student", "exam", "exam__course")
            .order_by("-submitted_at")
        )

        serializer = SubmissionListSerializer(submissions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def review(self, request, pk=None):
        """Get detailed review of submission with all answers."""
        submission = self.get_object()

        # Check if exam allows review
        if not submission.exam.allow_review and request.user.role == "student":
            if submission.status != "graded":
                return Response(
                    {"detail": "Review is not available for this exam."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # Use appropriate serializer
        if request.user.role == "student":
            serializer = SubmissionStudentSerializer(submission)
        else:
            serializer = SubmissionSerializer(submission)

        return Response(serializer.data)


@extend_schema(tags=["Submissions"])
class SubmissionAnswerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SubmissionAnswer model.
    Allows CRUD operations on individual answers.
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["question__question_number", "score"]
    ordering = ["question__question_number"]

    def get_serializer_class(self):
        """Return appropriate serializer based on user role."""
        if self.action in ["create", "update", "partial_update"]:
            return SubmissionAnswerSerializer
        elif self.request.user.role == "student":
            return SubmissionAnswerStudentSerializer
        return SubmissionAnswerDetailSerializer

    def get_queryset(self):
        """
        Filter answers based on user role.
        Students see only their own answers.
        Instructors see answers for their course submissions.
        """
        user = self.request.user
        queryset = SubmissionAnswer.objects.select_related(
            "submission",
            "submission__student",
            "submission__exam",
            "submission__exam__course",
            "question",
        )

        if user.role == "student":
            queryset = queryset.filter(submission__student=user)
        elif user.role == "instructor":
            queryset = queryset.filter(submission__exam__course__instructor=user)

        # Filter by submission
        submission_id = self.request.query_params.get("submission")
        if submission_id:
            queryset = queryset.filter(submission_id=submission_id)

        # Filter by grading status
        ungraded = self.request.query_params.get("ungraded")
        if ungraded and ungraded.lower() in ["true", "1", "yes"]:
            queryset = queryset.filter(score__isnull=True)

        needs_review = self.request.query_params.get("needs_review")
        if needs_review and needs_review.lower() in ["true", "1", "yes"]:
            queryset = queryset.filter(requires_manual_review=True)

        return queryset

    def perform_create(self, serializer):
        """Validate user can create answer."""
        submission = serializer.validated_data.get("submission")

        if not submission:
            raise ValueError("Submission is required to create an answer.")

        if submission.student != self.request.user:
            raise PermissionError("You can only create answers for your own submissions.")

        if submission.status != "in_progress":
            raise ValueError("Cannot add answers to a submitted submission.")

        serializer.save()

    def perform_update(self, serializer):
        """Validate user can update answer."""
        answer = self.get_object()

        if answer.submission.student != self.request.user:
            raise PermissionError("You can only update your own answers.")

        if answer.submission.status != "in_progress":
            raise ValueError("Cannot modify answers after submission.")

        serializer.save()

    @action(detail=True, methods=["post"])
    def grade(self, request, pk=None):
        """Grade this answer (instructors only)."""
        answer = self.get_object()

        # Check permission
        if request.user.role != "instructor":
            return Response(
                {"detail": "Only instructors can grade answers."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if answer.submission.exam.course.instructor != request.user:
            return Response(
                {"detail": "You can only grade submissions for your courses."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = SubmissionGradeSerializer(data=request.data, context={"answer": answer})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response_serializer = SubmissionAnswerDetailSerializer(answer)
        return Response(response_serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@extend_schema(tags=["Submissions"])
def dashboard_stats(request):
    """Get dashboard statistics for the current student."""
    if request.user.role != "student":
        return Response(
            {"detail": "Only students can access this endpoint."},
            status=status.HTTP_403_FORBIDDEN,
        )

    user = request.user
    now = timezone.now()

    # Get upcoming exams count (published exams that haven't started yet)
    upcoming_exams_count = Exam.objects.filter(
        status="published",
        start_time__gt=now,
    ).count()

    # Get completed exams count (graded submissions for this student)
    completed_exams_count = Submission.objects.filter(
        student=user,
        status="graded",
    ).count()

    # Get average score from graded submissions
    avg_result = Submission.objects.filter(
        student=user,
        status="graded",
        percentage__isnull=False,
    ).aggregate(average_score=Avg("percentage"))
    average_score = avg_result["average_score"]
    if average_score is not None:
        average_score = round(float(average_score), 1)

    # Get pending results count (submitted but not yet graded)
    pending_results_count = Submission.objects.filter(
        student=user,
        status="submitted",
    ).count()

    return Response(
        {
            "upcoming_exams_count": upcoming_exams_count,
            "completed_exams_count": completed_exams_count,
            "average_score": average_score,
            "pending_results_count": pending_results_count,
        }
    )
