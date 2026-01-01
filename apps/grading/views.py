"""
Views for grading app.
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import GradingTask, GradingConfiguration
from .serializers import (
    GradingTaskSerializer,
    GradingConfigurationSerializer,
    GradingConfigurationListSerializer,
    GradingServiceInfoSerializer,
    BulkGradeSerializer,
)
from apps.core.permissions import IsInstructor
from .tasks import bulk_grade_submissions


class GradingTaskViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing grading tasks.
    Read-only - tasks are created automatically by the grading system.
    """

    serializer_class = GradingTaskSerializer
    permission_classes = [IsAuthenticated, IsInstructor]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["submission__student__email", "grading_method", "status"]
    ordering_fields = ["started_at", "completed_at", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """
        Get grading tasks for instructor's submissions.
        """
        user = self.request.user
        queryset = GradingTask.objects.select_related(
            "submission",
            "submission__student",
            "submission__exam",
            "submission__exam__course",
        )

        # Instructors see tasks for their courses
        if user.role == "instructor":
            queryset = queryset.filter(
                submission__exam__course__instructor=user
            )

        # Filter by status
        task_status = self.request.query_params.get("status")
        if task_status:
            queryset = queryset.filter(status=task_status)

        # Filter by grading method
        grading_method = self.request.query_params.get("method")
        if grading_method:
            queryset = queryset.filter(grading_method=grading_method)

        # Filter by submission
        submission_id = self.request.query_params.get("submission")
        if submission_id:
            queryset = queryset.filter(submission_id=submission_id)

        return queryset

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Get grading task statistics."""
        queryset = self.get_queryset()

        stats = {
            "total": queryset.count(),
            "pending": queryset.filter(status="pending").count(),
            "in_progress": queryset.filter(status="in_progress").count(),
            "completed": queryset.filter(status="completed").count(),
            "failed": queryset.filter(status="failed").count(),
            "by_method": {},
        }

        # Count by grading method
        for method in ["auto", "mock", "openai", "claude", "gemini", "manual"]:
            count = queryset.filter(grading_method=method).count()
            if count > 0:
                stats["by_method"][method] = count

        return Response(stats)


class GradingConfigurationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing grading configurations.
    Allows instructors to configure grading services.
    """

    permission_classes = [IsAuthenticated, IsInstructor]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["grading_service", "scope"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Return appropriate serializer."""
        if self.action == "list":
            return GradingConfigurationListSerializer
        return GradingConfigurationSerializer

    def get_queryset(self):
        """
        Get grading configurations.
        Instructors see global configs and their course configs.
        """
        user = self.request.user
        queryset = GradingConfiguration.objects.select_related(
            "exam", "question"
        )

        # Instructors see global configs + configs for their courses
        if user.role == "instructor":
            queryset = queryset.filter(
                Q(scope="global") |
                Q(exam__course__instructor=user) |
                Q(question__exam__course__instructor=user)
            )

        # Filter by scope
        scope = self.request.query_params.get("scope")
        if scope:
            queryset = queryset.filter(scope=scope)

        # Filter by grading service
        service = self.request.query_params.get("service")
        if service:
            queryset = queryset.filter(grading_service=service)

        # Filter by active status
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            is_active_bool = is_active.lower() in ["true", "1", "yes"]
            queryset = queryset.filter(is_active=is_active_bool)

        # Filter by exam
        exam_id = self.request.query_params.get("exam")
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)

        return queryset

    @action(detail=False, methods=["get"])
    def services(self, request):
        """Get information about available grading services."""
        services = [
            {
                "name": "mock",
                "display_name": "Mock Grading",
                "description": "Simple keyword matching and text similarity",
                "requires_api_key": False,
                "supported_models": ["default"],
                "default_model": "default",
                "configuration_options": {
                    "similarity_threshold": {
                        "type": "float",
                        "default": 0.7,
                        "min": 0.0,
                        "max": 1.0,
                        "description": "Minimum similarity threshold for matching",
                    }
                },
            },
            {
                "name": "openai",
                "display_name": "OpenAI GPT",
                "description": "Advanced AI grading using OpenAI GPT models",
                "requires_api_key": True,
                "supported_models": [
                    "gpt-4o",
                    "gpt-4o-mini",
                    "gpt-4-turbo",
                    "gpt-4",
                    "gpt-3.5-turbo",
                ],
                "default_model": "gpt-4o-mini",
                "configuration_options": {
                    "model": {
                        "type": "string",
                        "default": "gpt-4o-mini",
                        "description": "OpenAI model to use",
                    },
                    "temperature": {
                        "type": "float",
                        "default": 0.3,
                        "min": 0.0,
                        "max": 2.0,
                        "description": "Sampling temperature (0 = deterministic)",
                    },
                    "max_tokens": {
                        "type": "integer",
                        "default": 500,
                        "min": 1,
                        "max": 4000,
                        "description": "Maximum tokens in response",
                    },
                },
            },
            {
                "name": "claude",
                "display_name": "Anthropic Claude",
                "description": "Advanced AI grading using Anthropic Claude models",
                "requires_api_key": True,
                "supported_models": [
                    "claude-3-5-sonnet-20241022",
                    "claude-3-opus-20240229",
                    "claude-3-sonnet-20240229",
                    "claude-3-haiku-20240307",
                ],
                "default_model": "claude-3-5-sonnet-20241022",
                "configuration_options": {
                    "model": {
                        "type": "string",
                        "default": "claude-3-5-sonnet-20241022",
                        "description": "Claude model to use",
                    },
                    "temperature": {
                        "type": "float",
                        "default": 0.3,
                        "min": 0.0,
                        "max": 1.0,
                        "description": "Sampling temperature",
                    },
                    "max_tokens": {
                        "type": "integer",
                        "default": 1024,
                        "min": 1,
                        "max": 4096,
                        "description": "Maximum tokens in response",
                    },
                },
            },
            {
                "name": "gemini",
                "display_name": "Google Gemini",
                "description": "Advanced AI grading using Google Gemini models",
                "requires_api_key": True,
                "supported_models": [
                    "gemini-1.5-pro",
                    "gemini-1.5-flash",
                    "gemini-1.0-pro",
                ],
                "default_model": "gemini-1.5-flash",
                "configuration_options": {
                    "model": {
                        "type": "string",
                        "default": "gemini-1.5-flash",
                        "description": "Gemini model to use",
                    },
                    "temperature": {
                        "type": "float",
                        "default": 0.3,
                        "min": 0.0,
                        "max": 2.0,
                        "description": "Sampling temperature",
                    },
                    "max_tokens": {
                        "type": "integer",
                        "default": 1024,
                        "min": 1,
                        "description": "Maximum tokens in response",
                    },
                },
            },
        ]

        serializer = GradingServiceInfoSerializer(services, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def bulk_grade(self, request):
        """Trigger bulk grading for multiple submissions."""
        serializer = BulkGradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        submission_ids = serializer.validated_data["submission_ids"]
        force_regrade = serializer.validated_data.get("force_regrade", False)

        # Validate user has access to these submissions
        from apps.submissions.models import Submission

        submissions = Submission.objects.filter(
            id__in=submission_ids,
            exam__course__instructor=request.user,
        )

        if submissions.count() != len(submission_ids):
            return Response(
                {
                    "error": "Some submissions not found or you don't have permission to grade them."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Trigger bulk grading
        task = bulk_grade_submissions.delay(submission_ids)

        return Response(
            {
                "message": f"Bulk grading initiated for {len(submission_ids)} submissions",
                "task_id": task.id,
                "submission_count": len(submission_ids),
            }
        )
