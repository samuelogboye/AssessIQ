"""
Grading models for AssessIQ.
Tracks grading tasks and results.
"""

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.core.models import TimeStampedModel


class GradingTaskManager(models.Manager):
    """Custom manager for GradingTask model."""

    def pending(self):
        """Get pending grading tasks."""
        return self.filter(status="pending")

    def in_progress(self):
        """Get in-progress grading tasks."""
        return self.filter(status="in_progress")

    def completed(self):
        """Get completed grading tasks."""
        return self.filter(status="completed")

    def failed(self):
        """Get failed grading tasks."""
        return self.filter(status="failed")


class GradingTask(TimeStampedModel):
    """
    Represents an asynchronous grading task.
    Used to track the progress of automated grading.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    GRADING_METHOD_CHOICES = [
        ("mock", "Mock Grading"),
        ("openai", "OpenAI GPT"),
        ("claude", "Anthropic Claude"),
        ("gemini", "Google Gemini"),
        ("manual", "Manual Grading"),
    ]

    submission = models.ForeignKey(
        "submissions.Submission", on_delete=models.CASCADE, related_name="grading_tasks"
    )
    submission_answer = models.ForeignKey(
        "submissions.SubmissionAnswer",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="grading_tasks",
        help_text=_("Specific answer being graded (if applicable)"),
    )
    grading_method = models.CharField(max_length=20, choices=GRADING_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    # Task execution
    celery_task_id = models.CharField(
        max_length=255, blank=True, help_text=_("Celery task ID for tracking")
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Results
    result = models.JSONField(null=True, blank=True, help_text=_("Grading result data"))
    error_message = models.TextField(blank=True, help_text=_("Error message if grading failed"))

    # Retry logic
    retry_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)

    objects = GradingTaskManager()

    class Meta:
        db_table = "grading_tasks"
        verbose_name = _("grading task")
        verbose_name_plural = _("grading tasks")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["submission", "status"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["celery_task_id"]),
        ]

    def __str__(self):
        return f"Grading Task for {self.submission} - {self.get_status_display()}"

    @property
    def duration(self):
        """Calculate task duration."""
        if self.started_at and self.completed_at:
            return self.completed_at - self.started_at
        return None

    @property
    def can_retry(self):
        """Check if task can be retried."""
        return self.status == "failed" and self.retry_count < self.max_retries

    def mark_in_progress(self):
        """Mark task as in progress."""
        self.status = "in_progress"
        self.started_at = timezone.now()
        self.save(update_fields=["status", "started_at", "updated_at"])

    def mark_completed(self, result):
        """Mark task as completed with results."""
        self.status = "completed"
        self.completed_at = timezone.now()
        self.result = result
        self.save(update_fields=["status", "completed_at", "result", "updated_at"])

    def mark_failed(self, error_message):
        """Mark task as failed with error message."""
        self.status = "failed"
        self.error_message = error_message
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "error_message", "completed_at", "updated_at"])

    def increment_retry(self):
        """Increment retry count."""
        self.retry_count += 1
        self.status = "pending"
        self.save(update_fields=["retry_count", "status", "updated_at"])


class GradingFeedback(TimeStampedModel):
    """
    Stores detailed grading feedback for submissions or individual answers.
    """

    submission_answer = models.OneToOneField(
        "submissions.SubmissionAnswer", on_delete=models.CASCADE, related_name="detailed_feedback"
    )
    feedback_text = models.TextField(help_text=_("Detailed feedback from grading"))
    score_breakdown = models.JSONField(
        null=True, blank=True, help_text=_("Detailed score breakdown")
    )
    strengths = models.JSONField(
        null=True, blank=True, help_text=_("List of strengths identified in the answer")
    )
    improvements = models.JSONField(
        null=True, blank=True, help_text=_("List of areas for improvement")
    )
    grading_confidence = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=_("Confidence score of automated grading (0-100)"),
    )
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="grading_feedbacks",
        help_text=_("User who provided manual feedback (if applicable)"),
    )

    class Meta:
        db_table = "grading_feedback"
        verbose_name = _("grading feedback")
        verbose_name_plural = _("grading feedbacks")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["submission_answer"]),
            models.Index(fields=["grading_confidence"]),
        ]

    def __str__(self):
        return f"Feedback for {self.submission_answer}"


class GradingConfiguration(TimeStampedModel):
    """
    Configuration for grading services and methods.
    Allows per-exam or per-question customization.
    """

    SCOPE_CHOICES = [
        ("global", "Global"),
        ("exam", "Exam-specific"),
        ("question", "Question-specific"),
    ]

    scope = models.CharField(max_length=20, choices=SCOPE_CHOICES, default="global")
    exam = models.ForeignKey(
        "assessments.Exam",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="grading_configurations",
    )
    question = models.ForeignKey(
        "assessments.Question",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="grading_configurations",
    )

    # Service configuration
    grading_service = models.CharField(
        max_length=20,
        default="mock",
        help_text=_("Grading service to use: mock, openai, claude, gemini"),
    )
    service_config = models.JSONField(
        default=dict, help_text=_("Service-specific configuration (model, temperature, etc.)")
    )

    # Grading parameters
    auto_grade_threshold = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=80.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=_("Confidence threshold for auto-grading (0-100)"),
    )
    require_manual_review = models.BooleanField(
        default=False, help_text=_("Always require manual review regardless of confidence")
    )

    # Timeout and retry
    grading_timeout = models.PositiveIntegerField(
        default=300, help_text=_("Grading timeout in seconds")
    )
    max_retries = models.PositiveIntegerField(
        default=3, help_text=_("Maximum retry attempts for failed grading")
    )

    # Prompt templates (for LLM grading)
    system_prompt = models.TextField(
        blank=True, help_text=_("System prompt template for LLM grading")
    )
    grading_prompt_template = models.TextField(
        blank=True, help_text=_("Grading prompt template with placeholders")
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "grading_configurations"
        verbose_name = _("grading configuration")
        verbose_name_plural = _("grading configurations")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["scope", "is_active"]),
            models.Index(fields=["exam", "is_active"]),
            models.Index(fields=["question", "is_active"]),
        ]

    def __str__(self):
        if self.scope == "exam" and self.exam:
            return f"Config for Exam: {self.exam.title}"
        elif self.scope == "question" and self.question:
            return f"Config for Question: {self.question}"
        return f"Global Config ({self.grading_service})"

    def clean(self):
        """Validate configuration based on scope."""
        from django.core.exceptions import ValidationError

        if self.scope == "exam" and not self.exam:
            raise ValidationError({"exam": _("Exam is required for exam-specific configuration")})

        if self.scope == "question" and not self.question:
            raise ValidationError(
                {"question": _("Question is required for question-specific configuration")}
            )

        if self.scope == "global" and (self.exam or self.question):
            raise ValidationError(_("Global configuration should not have exam or question set"))
