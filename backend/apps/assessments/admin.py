"""
Admin configuration for assessments app.
"""

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Course, Exam, Question


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    """Admin configuration for Course model."""

    list_display = ["code", "name", "instructor", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["code", "name", "instructor__email"]
    ordering = ["code"]
    date_hierarchy = "created_at"

    fieldsets = (
        (None, {"fields": ("code", "name", "description", "instructor")}),
        (_("Status"), {"fields": ("is_active",)}),
    )


class QuestionInline(admin.TabularInline):
    """Inline admin for Questions within Exam."""

    model = Question
    extra = 1
    fields = ["question_number", "question_type", "question_text", "marks", "correct_answer"]
    ordering = ["question_number"]


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    """Admin configuration for Exam model."""

    list_display = [
        "title",
        "course",
        "status",
        "duration_minutes",
        "total_marks",
        "start_time",
        "end_time",
        "created_at",
    ]
    list_filter = ["status", "course", "created_at", "start_time"]
    search_fields = ["title", "course__code", "course__name"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"
    inlines = [QuestionInline]

    fieldsets = (
        (None, {"fields": ("title", "description", "course")}),
        (
            _("Configuration"),
            {"fields": ("duration_minutes", "total_marks", "passing_marks", "max_attempts")},
        ),
        (_("Availability"), {"fields": ("status", "start_time", "end_time")}),
        (
            _("Settings"),
            {
                "fields": ("instructions", "allow_review", "shuffle_questions"),
                "classes": ("collapse",),
            },
        ),
    )

    readonly_fields = ["created_at", "updated_at"]

    def get_readonly_fields(self, request, obj=None):
        """Make certain fields readonly after creation."""
        readonly = list(self.readonly_fields)
        if obj and obj.submissions.exists():
            # Can't change these after submissions exist
            readonly.extend(["total_marks", "duration_minutes"])
        return readonly


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    """Admin configuration for Question model."""

    list_display = [
        "exam",
        "question_number",
        "question_type",
        "marks",
        "use_ai_grading",
        "created_at",
    ]
    list_filter = ["question_type", "use_ai_grading", "exam__course", "created_at"]
    search_fields = ["question_text", "exam__title"]
    ordering = ["exam", "question_number"]

    fieldsets = (
        (None, {"fields": ("exam", "question_number", "question_type", "question_text", "marks")}),
        (_("Options & Answers"), {"fields": ("options", "correct_answer", "acceptable_answers")}),
        (
            _("Grading Configuration"),
            {
                "fields": ("use_ai_grading", "grading_rubric", "keywords", "keyword_weight"),
                "classes": ("collapse",),
            },
        ),
    )

    readonly_fields = ["created_at", "updated_at"]
