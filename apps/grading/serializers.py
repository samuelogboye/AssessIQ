"""
Serializers for grading app.
"""

from rest_framework import serializers
from .models import GradingTask, GradingConfiguration
from apps.submissions.serializers import SubmissionListSerializer


class GradingTaskSerializer(serializers.ModelSerializer):
    """Serializer for Grading Task model."""

    submission = SubmissionListSerializer(read_only=True)
    duration = serializers.SerializerMethodField()

    class Meta:
        model = GradingTask
        fields = [
            "id",
            "submission",
            "submission_answer",
            "grading_method",
            "status",
            "started_at",
            "completed_at",
            "celery_task_id",
            "result",
            "error_message",
            "retry_count",
            "max_retries",
            "duration",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_duration(self, obj):
        """Calculate task duration in seconds."""
        if obj.completed_at and obj.started_at:
            delta = obj.completed_at - obj.started_at
            return delta.total_seconds()
        return None


class GradingConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for Grading Configuration model."""

    exam_title = serializers.CharField(source="exam.title", read_only=True)
    question_text = serializers.CharField(source="question.question_text", read_only=True)

    class Meta:
        model = GradingConfiguration
        fields = [
            "id",
            "scope",
            "exam",
            "exam_title",
            "question",
            "question_text",
            "grading_service",
            "service_config",
            "auto_grade_threshold",
            "require_manual_review",
            "grading_timeout",
            "max_retries",
            "system_prompt",
            "grading_prompt_template",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        """Validate grading configuration."""
        scope = attrs.get("scope")
        exam = attrs.get("exam")
        question = attrs.get("question")

        # Validate scope-specific requirements
        if scope == "global":
            if exam or question:
                raise serializers.ValidationError(
                    {"scope": "Global scope cannot have exam or question."}
                )
        elif scope == "exam":
            if not exam:
                raise serializers.ValidationError(
                    {"exam": "Exam is required for exam-level scope."}
                )
            if question:
                raise serializers.ValidationError(
                    {"question": "Question should not be set for exam-level scope."}
                )
        elif scope == "question":
            if not question:
                raise serializers.ValidationError(
                    {"question": "Question is required for question-level scope."}
                )
            if not exam:
                # Auto-set exam from question
                attrs["exam"] = question.exam

        # Validate grading service
        grading_service = attrs.get("grading_service")
        valid_services = ["mock", "openai", "claude", "gemini"]
        if grading_service not in valid_services:
            raise serializers.ValidationError(
                {
                    "grading_service": f"Invalid grading service. Must be one of: {', '.join(valid_services)}"
                }
            )

        # Validate service config if provided
        service_config = attrs.get("service_config", {})
        if grading_service == "openai":
            self._validate_openai_config(service_config)
        elif grading_service == "claude":
            self._validate_claude_config(service_config)
        elif grading_service == "gemini":
            self._validate_gemini_config(service_config)

        return attrs

    def _validate_openai_config(self, config):
        """Validate OpenAI service configuration."""
        if "model" in config:
            valid_models = ["gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]
            if config["model"] not in valid_models:
                raise serializers.ValidationError(
                    {
                        "service_config": f"Invalid OpenAI model. Must be one of: {', '.join(valid_models)}"
                    }
                )

        if "temperature" in config:
            temp = config["temperature"]
            if not isinstance(temp, (int, float)) or not (0 <= temp <= 2):
                raise serializers.ValidationError(
                    {"service_config": "Temperature must be between 0 and 2"}
                )

    def _validate_claude_config(self, config):
        """Validate Claude service configuration."""
        if "model" in config:
            valid_models = [
                "claude-3-5-sonnet-20241022",
                "claude-3-opus-20240229",
                "claude-3-sonnet-20240229",
                "claude-3-haiku-20240307",
            ]
            if config["model"] not in valid_models:
                raise serializers.ValidationError(
                    {
                        "service_config": f"Invalid Claude model. Must be one of: {', '.join(valid_models)}"
                    }
                )

        if "temperature" in config:
            temp = config["temperature"]
            if not isinstance(temp, (int, float)) or not (0 <= temp <= 1):
                raise serializers.ValidationError(
                    {"service_config": "Temperature must be between 0 and 1 for Claude"}
                )

    def _validate_gemini_config(self, config):
        """Validate Gemini service configuration."""
        if "model" in config:
            valid_models = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro"]
            if config["model"] not in valid_models:
                raise serializers.ValidationError(
                    {
                        "service_config": f"Invalid Gemini model. Must be one of: {', '.join(valid_models)}"
                    }
                )

        if "temperature" in config:
            temp = config["temperature"]
            if not isinstance(temp, (int, float)) or not (0 <= temp <= 2):
                raise serializers.ValidationError(
                    {"service_config": "Temperature must be between 0 and 2"}
                )


class GradingConfigurationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing grading configurations."""

    exam_title = serializers.CharField(source="exam.title", read_only=True)
    question_text = serializers.CharField(source="question.question_text", read_only=True)

    class Meta:
        model = GradingConfiguration
        fields = [
            "id",
            "scope",
            "exam_title",
            "question_text",
            "grading_service",
            "is_active",
            "created_at",
        ]


class GradingServiceInfoSerializer(serializers.Serializer):
    """Serializer for grading service information."""

    name = serializers.CharField()
    display_name = serializers.CharField()
    description = serializers.CharField()
    requires_api_key = serializers.BooleanField()
    supported_models = serializers.ListField(child=serializers.CharField())
    default_model = serializers.CharField()
    configuration_options = serializers.DictField()


class BulkGradeSerializer(serializers.Serializer):
    """Serializer for bulk grading request."""

    submission_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        allow_empty=False,
    )
    force_regrade = serializers.BooleanField(default=False)

    def validate_submission_ids(self, value):
        """Validate submission IDs."""
        if len(value) > 100:
            raise serializers.ValidationError("Cannot grade more than 100 submissions at once.")
        return value
