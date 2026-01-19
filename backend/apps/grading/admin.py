"""
Admin configuration for grading app.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import GradingConfiguration, GradingFeedback, GradingTask


@admin.register(GradingTask)
class GradingTaskAdmin(admin.ModelAdmin):
    """Admin configuration for GradingTask model."""

    list_display = [
        "id",
        "submission_info",
        "grading_method",
        "status_display",
        "retry_count",
        "duration_display",
        "created_at",
    ]
    list_filter = ["status", "grading_method", "created_at"]
    search_fields = ["submission__student__email", "submission__exam__title", "celery_task_id"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        (None, {"fields": ("submission", "submission_answer", "grading_method", "status")}),
        (_("Task Execution"), {"fields": ("celery_task_id", "started_at", "completed_at")}),
        (_("Results"), {"fields": ("result", "error_message")}),
        (_("Retry Configuration"), {"fields": ("retry_count", "max_retries")}),
    )

    readonly_fields = ["celery_task_id", "started_at", "completed_at", "result", "error_message"]

    def submission_info(self, obj):
        return f"{obj.submission.student.email} - {obj.submission.exam.title}"

    submission_info.short_description = "Submission"

    def status_display(self, obj):
        """Display status with color coding."""
        colors = {
            "pending": "gray",
            "in_progress": "blue",
            "completed": "green",
            "failed": "red",
        }
        color = colors.get(obj.status, "black")
        return format_html('<span style="color: {};">{}</span>', color, obj.get_status_display())

    status_display.short_description = "Status"

    def duration_display(self, obj):
        """Display task duration."""
        duration = obj.duration
        if duration:
            return f"{duration.total_seconds():.2f}s"
        return "-"

    duration_display.short_description = "Duration"

    actions = ["retry_failed_tasks"]

    def retry_failed_tasks(self, request, queryset):
        """Retry failed grading tasks."""
        count = 0
        for task in queryset.filter(status="failed"):
            if task.can_retry:
                task.increment_retry()
                # Trigger retry (would need to import and call the actual task)
                count += 1

        self.message_user(request, f"{count} task(s) queued for retry.")

    retry_failed_tasks.short_description = "Retry failed tasks"


@admin.register(GradingFeedback)
class GradingFeedbackAdmin(admin.ModelAdmin):
    """Admin configuration for GradingFeedback model."""

    list_display = ["submission_answer_info", "grading_confidence", "graded_by", "created_at"]
    list_filter = ["grading_confidence", "graded_by", "created_at"]
    search_fields = [
        "submission_answer__submission__student__email",
        "submission_answer__submission__exam__title",
        "feedback_text",
    ]
    ordering = ["-created_at"]

    fieldsets = (
        (None, {"fields": ("submission_answer",)}),
        (_("Feedback"), {"fields": ("feedback_text", "score_breakdown")}),
        (_("Analysis"), {"fields": ("strengths", "improvements", "grading_confidence")}),
        (_("Grader"), {"fields": ("graded_by",)}),
    )

    readonly_fields = ["submission_answer"]

    def submission_answer_info(self, obj):
        return str(obj.submission_answer)

    submission_answer_info.short_description = "Answer"


@admin.register(GradingConfiguration)
class GradingConfigurationAdmin(admin.ModelAdmin):
    """Admin configuration for GradingConfiguration model."""

    list_display = [
        "__str__",
        "scope",
        "grading_service",
        "auto_grade_threshold",
        "is_active",
        "created_at",
    ]
    list_filter = ["scope", "grading_service", "is_active", "created_at"]
    search_fields = ["exam__title", "question__question_text"]
    ordering = ["scope", "-created_at"]

    fieldsets = (
        (None, {"fields": ("scope", "exam", "question", "is_active")}),
        (_("Service Configuration"), {"fields": ("grading_service", "service_config")}),
        (
            _("Grading Parameters"),
            {
                "fields": (
                    "auto_grade_threshold",
                    "require_manual_review",
                    "grading_timeout",
                    "max_retries",
                )
            },
        ),
        (
            _("LLM Prompts"),
            {"fields": ("system_prompt", "grading_prompt_template"), "classes": ("collapse",)},
        ),
    )

    def get_form(self, request, obj=None, **kwargs):
        """Customize form based on scope."""
        form = super().get_form(request, obj, **kwargs)

        # Conditionally required fields based on scope
        if obj:
            if obj.scope == "global":
                form.base_fields["exam"].required = False
                form.base_fields["question"].required = False
            elif obj.scope == "exam":
                form.base_fields["exam"].required = True
                form.base_fields["question"].required = False
            elif obj.scope == "question":
                form.base_fields["question"].required = True
                form.base_fields["exam"].required = False

        return form
