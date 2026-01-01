"""
Assessment models for AssessIQ.
Includes Course, Exam, and Question models.
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from apps.core.models import TimeStampedModel


class CourseManager(models.Manager):
    """Custom manager for Course model."""

    def active(self):
        """Return only active courses."""
        return self.filter(is_active=True)


class Course(TimeStampedModel):
    """
    Course model for organizing exams.
    """

    code = models.CharField(
        max_length=20, unique=True, help_text=_("Unique course code (e.g., CS101)")
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="courses",
        limit_choices_to={"role": "instructor"},
    )
    is_active = models.BooleanField(default=True)

    objects = CourseManager()

    class Meta:
        db_table = "courses"
        verbose_name = _("course")
        verbose_name_plural = _("courses")
        ordering = ["code"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["instructor", "is_active"]),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class ExamManager(models.Manager):
    """Custom manager for Exam model."""

    def get_queryset(self):
        """Optimize default queryset with select_related."""
        return super().get_queryset().select_related("course", "course__instructor")

    def published(self):
        """Return only published exams."""
        return self.filter(status="published")

    def available(self):
        """Return exams that are currently available."""
        now = timezone.now()
        return self.filter(status="published", start_time__lte=now, end_time__gte=now)

    def upcoming(self):
        """Return upcoming published exams."""
        now = timezone.now()
        return self.filter(status="published", start_time__gt=now)


class Exam(TimeStampedModel):
    """
    Exam model representing an assessment.
    """

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("archived", "Archived"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="exams")
    duration_minutes = models.PositiveIntegerField(help_text=_("Exam duration in minutes"))
    total_marks = models.DecimalField(
        max_digits=6, decimal_places=2, default=100.00, validators=[MinValueValidator(0)]
    )
    passing_marks = models.DecimalField(
        max_digits=6, decimal_places=2, default=40.00, validators=[MinValueValidator(0)]
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    start_time = models.DateTimeField(
        null=True, blank=True, help_text=_("Exam availability start time")
    )
    end_time = models.DateTimeField(
        null=True, blank=True, help_text=_("Exam availability end time")
    )
    instructions = models.TextField(blank=True, help_text=_("Instructions for students"))
    allow_review = models.BooleanField(
        default=True, help_text=_("Allow students to review their submissions")
    )
    shuffle_questions = models.BooleanField(
        default=False, help_text=_("Randomize question order for each student")
    )
    max_attempts = models.PositiveIntegerField(
        default=1, help_text=_("Maximum number of attempts allowed")
    )

    objects = ExamManager()

    class Meta:
        db_table = "exams"
        verbose_name = _("exam")
        verbose_name_plural = _("exams")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["course", "status"]),
            models.Index(fields=["status", "start_time", "end_time"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.course.code} - {self.title}"

    def check_is_available(self):
        """Check if exam is currently available for taking."""
        if self.status != "published":
            return False
        now = timezone.now()
        if self.start_time and now < self.start_time:
            return False
        if self.end_time and now > self.end_time:
            return False
        return True

    def get_question_count(self):
        """Get total number of questions in the exam."""
        return self.questions.count()

    def calculate_total_marks(self):
        """Calculate total marks based on questions."""
        return self.questions.aggregate(total=models.Sum("marks"))["total"] or 0


class QuestionManager(models.Manager):
    """Custom manager for Question model."""

    def get_queryset(self):
        """Optimize default queryset."""
        return super().get_queryset().select_related("exam", "exam__course")


class Question(TimeStampedModel):
    """
    Question model for exam questions.
    Supports multiple question types.
    """

    QUESTION_TYPE_CHOICES = [
        ("multiple_choice", "Multiple Choice"),
        ("short_answer", "Short Answer"),
        ("essay", "Essay"),
        ("true_false", "True/False"),
    ]

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="questions")
    question_number = models.PositiveIntegerField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    question_text = models.TextField()
    marks = models.DecimalField(
        max_digits=5, decimal_places=2, default=1.00, validators=[MinValueValidator(0)]
    )

    # For multiple choice questions
    options = models.JSONField(
        null=True, blank=True, help_text=_("JSON array of options for multiple choice questions")
    )

    # Expected answer(s)
    correct_answer = models.TextField(help_text=_("Correct answer or answer key"))

    # Alternative acceptable answers (for flexibility)
    acceptable_answers = models.JSONField(
        null=True, blank=True, help_text=_("JSON array of acceptable alternative answers")
    )

    # Grading configuration
    use_ai_grading = models.BooleanField(
        default=False, help_text=_("Use AI/LLM for grading this question")
    )
    grading_rubric = models.TextField(
        blank=True, help_text=_("Grading rubric for AI or manual grading")
    )

    # Keywords for keyword-based grading
    keywords = models.JSONField(
        null=True, blank=True, help_text=_("Keywords for automated grading")
    )
    keyword_weight = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=1.00,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
        help_text=_("Weight of keyword matching in grading (0-1)"),
    )

    objects = QuestionManager()

    class Meta:
        db_table = "questions"
        verbose_name = _("question")
        verbose_name_plural = _("questions")
        ordering = ["exam", "question_number"]
        unique_together = [["exam", "question_number"]]
        indexes = [
            models.Index(fields=["exam", "question_number"]),
            models.Index(fields=["question_type"]),
        ]

    def __str__(self):
        return f"Q{self.question_number}: {self.question_text[:50]}..."

    def clean(self):
        """Validate question data."""
        from django.core.exceptions import ValidationError

        if self.question_type == "multiple_choice" and not self.options:
            raise ValidationError({"options": _("Multiple choice questions must have options")})

        if self.marks > self.exam.total_marks:
            raise ValidationError({"marks": _("Question marks cannot exceed exam total marks")})
