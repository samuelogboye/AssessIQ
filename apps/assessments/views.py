"""
Views for assessments app.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Prefetch
from django.utils import timezone

from .models import Course, Exam, Question
from .serializers import (
    CourseSerializer,
    ExamSerializer,
    ExamListSerializer,
    ExamStudentSerializer,
    ExamStudentListSerializer,
    ExamCreateSerializer,
    QuestionSerializer,
    QuestionListSerializer,
    QuestionStudentSerializer,
)
from apps.core.permissions import (
    IsInstructor,
    IsInstructorOrReadOnly,
    IsStudent,
    IsOwner,
)


class CourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Course model.
    Instructors can create and manage courses.
    Students can view active courses.
    """

    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, IsInstructorOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name", "description"]
    ordering_fields = ["code", "name", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """
        Filter courses based on user role.
        Students see only active courses.
        Instructors see their own courses.
        """
        user = self.request.user
        queryset = Course.objects.select_related("instructor").annotate(
            exam_count=Count("exams")
        )

        # Filter by query parameters
        is_active = self.request.query_params.get("is_active")
        instructor_id = self.request.query_params.get("instructor")

        if user.role == "student":
            # Students only see active courses
            queryset = queryset.filter(is_active=True)
        elif user.role == "instructor":
            # Instructors see their own courses by default
            # Unless they specify another instructor (for viewing purposes)
            if instructor_id:
                queryset = queryset.filter(instructor_id=instructor_id)
            else:
                queryset = queryset.filter(instructor=user)

        # Apply is_active filter if provided
        if is_active is not None:
            is_active_bool = is_active.lower() in ["true", "1", "yes"]
            queryset = queryset.filter(is_active=is_active_bool)

        return queryset

    def perform_create(self, serializer):
        """Set the instructor to the current user."""
        serializer.save(instructor=self.request.user)

    @action(detail=True, methods=["get"])
    def exams(self, request, pk=None):
        """Get all exams for a course."""
        course = self.get_object()
        exams = course.exams.all().annotate(question_count=Count("questions"))

        # Use different serializer based on user role
        if request.user.role == "student":
            serializer = ExamStudentListSerializer(exams, many=True)
        else:
            serializer = ExamListSerializer(exams, many=True)

        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        """Toggle course active status."""
        course = self.get_object()

        # Only course instructor can toggle
        if course.instructor != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to modify this course."},
                status=status.HTTP_403_FORBIDDEN,
            )

        course.is_active = not course.is_active
        course.save(update_fields=["is_active", "updated_at"])

        return Response(
            {"is_active": course.is_active, "message": f"Course {'activated' if course.is_active else 'deactivated'} successfully."}
        )


class ExamViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Exam model (instructor view).
    Only instructors can create and manage exams.
    """

    permission_classes = [IsAuthenticated, IsInstructor]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "course__name"]
    ordering_fields = ["title", "start_time", "created_at", "status"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "create":
            return ExamCreateSerializer
        elif self.action == "list":
            return ExamListSerializer
        return ExamSerializer

    def get_queryset(self):
        """
        Get exams for the instructor's courses.
        """
        user = self.request.user
        queryset = (
            Exam.objects.select_related("course", "course__instructor")
            .prefetch_related("questions")
            .annotate(question_count=Count("questions"))
        )

        # Instructors only see exams for their courses
        if user.role == "instructor":
            queryset = queryset.filter(course__instructor=user)

        # Filter by status
        exam_status = self.request.query_params.get("status")
        if exam_status:
            queryset = queryset.filter(status=exam_status)

        # Filter by course
        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        return queryset

    def perform_create(self, serializer):
        """Validate instructor owns the course."""
        course = serializer.validated_data.get("course")
        if course.instructor != self.request.user:
            raise PermissionError("You can only create exams for your own courses.")
        serializer.save()

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Publish an exam."""
        exam = self.get_object()

        if exam.course.instructor != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to modify this exam."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if exam.status == "published":
            return Response(
                {"detail": "Exam is already published."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate exam has questions
        if exam.questions.count() == 0:
            return Response(
                {"detail": "Cannot publish exam without questions."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exam.status = "published"
        exam.save(update_fields=["status", "updated_at"])

        return Response({"message": "Exam published successfully."})

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Archive an exam."""
        exam = self.get_object()

        if exam.course.instructor != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to modify this exam."},
                status=status.HTTP_403_FORBIDDEN,
            )

        exam.status = "archived"
        exam.save(update_fields=["status", "updated_at"])

        return Response({"message": "Exam archived successfully."})

    @action(detail=True, methods=["get"])
    def submissions(self, request, pk=None):
        """Get all submissions for an exam."""
        from apps.submissions.models import Submission
        from apps.submissions.serializers import SubmissionListSerializer

        exam = self.get_object()
        submissions = Submission.objects.filter(exam=exam).select_related(
            "student", "exam", "exam__course"
        )

        serializer = SubmissionListSerializer(submissions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def statistics(self, request, pk=None):
        """Get statistics for an exam."""
        from apps.submissions.models import Submission
        from django.db.models import Avg, Max, Min, Count

        exam = self.get_object()
        submissions = Submission.objects.filter(exam=exam, status="graded")

        stats = submissions.aggregate(
            total_submissions=Count("id"),
            average_score=Avg("total_score"),
            highest_score=Max("total_score"),
            lowest_score=Min("total_score"),
            pass_count=Count("id", filter=Q(total_score__gte=exam.passing_marks)),
        )

        stats["pass_rate"] = (
            (stats["pass_count"] / stats["total_submissions"] * 100)
            if stats["total_submissions"] > 0
            else 0
        )

        return Response(stats)


class StudentExamViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for students to view available exams.
    """

    permission_classes = [IsAuthenticated, IsStudent]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "course__name"]
    ordering_fields = ["title", "start_time"]
    ordering = ["start_time"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "list":
            return ExamStudentListSerializer
        return ExamStudentSerializer

    def get_queryset(self):
        """
        Get published exams for active courses.
        Annotate with availability status.
        """
        now = timezone.now()
        queryset = (
            Exam.objects.filter(status="published", course__is_active=True)
            .select_related("course", "course__instructor")
            .prefetch_related("questions")
            .annotate(
                question_count=Count("questions"),
                is_available=Q(
                    Q(start_time__isnull=True) | Q(start_time__lte=now),
                    Q(end_time__isnull=True) | Q(end_time__gte=now),
                ),
            )
        )

        # Filter by course
        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        # Filter by availability
        available_only = self.request.query_params.get("available")
        if available_only and available_only.lower() in ["true", "1", "yes"]:
            queryset = queryset.filter(
                Q(start_time__isnull=True) | Q(start_time__lte=now),
                Q(end_time__isnull=True) | Q(end_time__gte=now),
            )

        return queryset

    @action(detail=True, methods=["get"])
    def my_submissions(self, request, pk=None):
        """Get user's submissions for this exam."""
        from apps.submissions.models import Submission
        from apps.submissions.serializers import SubmissionStudentSerializer

        exam = self.get_object()
        submissions = Submission.objects.filter(
            exam=exam, student=request.user
        ).prefetch_related("answers", "answers__question")

        serializer = SubmissionStudentSerializer(submissions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def can_attempt(self, request, pk=None):
        """Check if student can attempt this exam."""
        from apps.submissions.models import Submission

        exam = self.get_object()
        now = timezone.now()

        # Check if exam is available
        if exam.start_time and now < exam.start_time:
            return Response(
                {"can_attempt": False, "reason": "Exam has not started yet."}
            )

        if exam.end_time and now > exam.end_time:
            return Response(
                {"can_attempt": False, "reason": "Exam has ended."}
            )

        # Check attempt limit
        attempt_count = Submission.objects.filter(
            student=request.user, exam=exam
        ).count()

        if attempt_count >= exam.max_attempts:
            return Response(
                {
                    "can_attempt": False,
                    "reason": f"Maximum attempts ({exam.max_attempts}) reached.",
                    "attempts_used": attempt_count,
                }
            )

        # Check for in-progress submission
        in_progress = Submission.objects.filter(
            student=request.user, exam=exam, status="in_progress"
        ).exists()

        if in_progress:
            return Response(
                {
                    "can_attempt": False,
                    "reason": "You have an in-progress submission.",
                }
            )

        return Response(
            {
                "can_attempt": True,
                "attempts_used": attempt_count,
                "attempts_remaining": exam.max_attempts - attempt_count,
            }
        )


class QuestionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Question model.
    Only instructors can create and manage questions.
    """

    permission_classes = [IsAuthenticated, IsInstructor]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["question_number", "marks"]
    ordering = ["question_number"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "list":
            return QuestionListSerializer
        return QuestionSerializer

    def get_queryset(self):
        """
        Get questions for instructor's exams.
        Filter by exam_id if provided.
        """
        user = self.request.user
        queryset = Question.objects.select_related("exam", "exam__course")

        # Instructors only see questions for their courses
        if user.role == "instructor":
            queryset = queryset.filter(exam__course__instructor=user)

        # Filter by exam
        exam_id = self.request.query_params.get("exam")
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)

        # Filter by question type
        question_type = self.request.query_params.get("type")
        if question_type:
            queryset = queryset.filter(question_type=question_type)

        return queryset

    def perform_create(self, serializer):
        """Validate instructor owns the exam's course."""
        exam = serializer.validated_data.get("exam")
        if not exam:
            raise ValueError("Exam is required to create a question.")
        if exam.course.instructor != self.request.user:
            raise PermissionError("You can only create questions for your own exams.")
        serializer.save()

    def perform_update(self, serializer):
        """Validate instructor owns the exam's course."""
        exam = serializer.instance.exam
        if exam.course.instructor != self.request.user:
            raise PermissionError("You can only update questions for your own exams.")
        serializer.save()

    def perform_destroy(self, instance):
        """Validate instructor owns the exam's course."""
        if instance.exam.course.instructor != self.request.user:
            raise PermissionError("You can only delete questions for your own exams.")
        instance.delete()

    @action(detail=False, methods=["post"])
    def bulk_create(self, request):
        """Create multiple questions at once."""
        questions_data = request.data.get("questions", [])

        if not questions_data:
            return Response(
                {"detail": "No questions provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exam_id = request.data.get("exam_id")
        if not exam_id:
            return Response(
                {"detail": "exam_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate exam ownership
        try:
            exam = Exam.objects.get(id=exam_id)
            if exam.course.instructor != request.user:
                return Response(
                    {"detail": "You can only create questions for your own exams."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        except Exam.DoesNotExist:
            return Response(
                {"detail": "Exam not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Create questions
        created_questions = []
        errors = []

        for idx, question_data in enumerate(questions_data, start=1):
            question_data["exam"] = exam.id
            question_data.setdefault("question_number", idx)

            serializer = QuestionSerializer(data=question_data)
            if serializer.is_valid():
                serializer.save(exam=exam)
                created_questions.append(serializer.data)
            else:
                errors.append({"question_number": idx, "errors": serializer.errors})

        return Response(
            {
                "created": len(created_questions),
                "questions": created_questions,
                "errors": errors,
            },
            status=status.HTTP_201_CREATED if created_questions else status.HTTP_400_BAD_REQUEST,
        )
