"""
Admin configuration for submissions app.
"""

from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import Submission, SubmissionAnswer


class SubmissionAnswerInline(admin.TabularInline):
    """Inline admin for SubmissionAnswers within Submission."""

    model = SubmissionAnswer
    extra = 0
    fields = ["question", "answer_text", "score", "graded_by", "requires_manual_review"]
    readonly_fields = ["question", "answer_text"]
    ordering = ["question__question_number"]

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    """Admin configuration for Submission model."""

    list_display = [
        "student_email",
        "exam_title",
        "attempt_number",
        "status",
        "total_score",
        "percentage",
        "is_passed_display",
        "is_late",
        "submitted_at",
    ]
    list_filter = ["status", "is_late", "flagged_for_review", "exam__course", "created_at"]
    search_fields = ["student__email", "exam__title", "exam__course__code"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"
    inlines = [SubmissionAnswerInline]

    fieldsets = (
        (None, {"fields": ("student", "exam", "attempt_number", "status")}),
        (_("Timestamps"), {"fields": ("started_at", "submitted_at", "graded_at")}),
        (_("Scoring"), {"fields": ("total_score", "percentage")}),
        (_("Flags"), {"fields": ("is_late", "flagged_for_review")}),
        (_("Metadata"), {"fields": ("ip_address", "user_agent"), "classes": ("collapse",)}),
    )

    readonly_fields = ["started_at", "submitted_at", "graded_at"]

    def student_email(self, obj):
        return obj.student.email

    student_email.short_description = "Student"
    student_email.admin_order_field = "student__email"

    def exam_title(self, obj):
        return obj.exam.title

    exam_title.short_description = "Exam"
    exam_title.admin_order_field = "exam__title"

    def is_passed_display(self, obj):
        """Display pass/fail status with color."""
        if obj.is_passed is None:
            return "-"
        if obj.is_passed:
            return format_html('<span style="color: green;">✓ Passed</span>')
        return format_html('<span style="color: red;">✗ Failed</span>')

    is_passed_display.short_description = "Result"

    actions = ["mark_for_review", "trigger_grading"]

    def mark_for_review(self, request, queryset):
        """Mark submissions for manual review."""
        count = queryset.update(flagged_for_review=True)
        self.message_user(request, f"{count} submission(s) marked for review.")

    mark_for_review.short_description = "Mark selected for review"

    def trigger_grading(self, request, queryset):
        """Trigger grading for selected submissions."""
        from apps.grading.tasks import grade_submission

        count = 0
        for submission in queryset.filter(status="submitted"):
            grade_submission.delay(submission.id)
            count += 1

        self.message_user(request, f"Grading triggered for {count} submission(s).")

    trigger_grading.short_description = "Trigger grading"


@admin.register(SubmissionAnswer)
class SubmissionAnswerAdmin(admin.ModelAdmin):
    """Admin configuration for SubmissionAnswer model."""

    list_display = [
        "submission_info",
        "question_number",
        "score",
        "percentage_score_display",
        "graded_by",
        "requires_manual_review",
        "created_at",
    ]
    list_filter = [
        "requires_manual_review",
        "graded_by",
        "submission__exam__course",
        "question__question_type",
        "created_at",
    ]
    search_fields = [
        "submission__student__email",
        "submission__exam__title",
        "question__question_text",
    ]
    ordering = ["-created_at"]

    fieldsets = (
        (None, {"fields": ("submission", "question", "answer_text")}),
        (_("Grading"), {"fields": ("score", "feedback", "graded_by", "grading_metadata")}),
        (_("Review"), {"fields": ("requires_manual_review",)}),
    )

    readonly_fields = ["submission", "question", "answer_text", "grading_metadata"]

    def submission_info(self, obj):
        return f"{obj.submission.student.email} - {obj.submission.exam.title}"

    submission_info.short_description = "Submission"

    def question_number(self, obj):
        return f"Q{obj.question.question_number}"

    question_number.short_description = "Question"
    question_number.admin_order_field = "question__question_number"

    def percentage_score_display(self, obj):
        """Display percentage score."""
        percentage = obj.percentage_score
        if percentage is None:
            return "-"
        return f"{percentage:.1f}%"

    percentage_score_display.short_description = "Score %"
