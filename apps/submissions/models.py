"""
Submission models for AssessIQ.
Handles student exam submissions and answers.
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from apps.core.models import TimeStampedModel


class SubmissionManager(models.Manager):
    """Custom manager for Submission model."""

    def get_queryset(self):
        """Optimize default queryset with select_related and prefetch_related."""
        return (
            super()
            .get_queryset()
            .select_related("student", "exam", "exam__course")
            .prefetch_related("answers", "answers__question")
        )

    def for_student(self, student):
        """Get submissions for a specific student."""
        return self.filter(student=student)

    def for_exam(self, exam):
        """Get all submissions for a specific exam."""
        return self.filter(exam=exam)

    def pending_grading(self):
        """Get submissions that are pending grading."""
        return self.filter(status="submitted")

    def graded(self):
        """Get graded submissions."""
        return self.filter(status="graded")


class Submission(TimeStampedModel):
    """
    Submission model representing a student's exam attempt.
    """

    STATUS_CHOICES = [
        ("in_progress", "In Progress"),
        ("submitted", "Submitted"),
        ("graded", "Graded"),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submissions",
        limit_choices_to={"role": "student"},
    )
    exam = models.ForeignKey(
        "assessments.Exam", on_delete=models.CASCADE, related_name="submissions"
    )
    attempt_number = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="in_progress")

    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    # Scoring
    total_score = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)]
    )
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    # Flags
    is_late = models.BooleanField(default=False, help_text=_("Whether submission was late"))
    flagged_for_review = models.BooleanField(default=False, help_text=_("Flag for manual review"))

    # Additional metadata
    ip_address = models.GenericIPAddressField(
        null=True, blank=True, help_text=_("IP address from which submission was made")
    )
    user_agent = models.TextField(blank=True, help_text=_("Browser user agent string"))

    objects = SubmissionManager()

    class Meta:
        db_table = "submissions"
        verbose_name = _("submission")
        verbose_name_plural = _("submissions")
        ordering = ["-created_at"]
        unique_together = [["student", "exam", "attempt_number"]]
        indexes = [
            models.Index(fields=["student", "exam"]),
            models.Index(fields=["exam", "status"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["student", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.student.email} - {self.exam.title} (Attempt {self.attempt_number})"

    @property
    def is_passed(self):
        """Check if student passed the exam."""
        if self.total_score is None:
            return None
        return self.total_score >= self.exam.passing_marks

    @property
    def time_taken(self):
        """Calculate time taken for submission."""
        if self.submitted_at:
            return self.submitted_at - self.started_at
        return None

    def submit(self):
        """Mark submission as submitted."""
        if self.status != "in_progress":
            raise ValueError(_("Only in-progress submissions can be submitted"))

        self.status = "submitted"
        self.submitted_at = timezone.now()

        # Check if late
        if self.exam.end_time and self.submitted_at > self.exam.end_time:
            self.is_late = True

        self.save(update_fields=["status", "submitted_at", "is_late", "updated_at"])

    def calculate_score(self):
        """Calculate total score from all answers."""
        total = (
            self.answers.filter(score__isnull=False).aggregate(total=models.Sum("score"))["total"]
            or 0
        )

        self.total_score = total
        self.percentage = (total / self.exam.total_marks * 100) if self.exam.total_marks > 0 else 0
        self.save(update_fields=["total_score", "percentage", "updated_at"])

        return self.total_score

    def mark_as_graded(self):
        """Mark submission as graded."""
        self.status = "graded"
        self.graded_at = timezone.now()
        self.save(update_fields=["status", "graded_at", "updated_at"])


class SubmissionAnswerManager(models.Manager):
    """Custom manager for SubmissionAnswer model."""

    def get_queryset(self):
        """Optimize default queryset."""
        return (
            super()
            .get_queryset()
            .select_related("submission", "submission__student", "question", "question__exam")
        )

    def ungraded(self):
        """Get answers that haven't been graded yet."""
        return self.filter(score__isnull=True)

    def graded(self):
        """Get answers that have been graded."""
        return self.filter(score__isnull=False)


class SubmissionAnswer(TimeStampedModel):
    """
    Individual answer for a question in a submission.
    """

    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(
        "assessments.Question", on_delete=models.CASCADE, related_name="student_answers"
    )
    answer_text = models.TextField(help_text=_("Student's answer"))

    # Grading
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text=_("Score awarded for this answer"),
    )
    feedback = models.TextField(blank=True, help_text=_("Feedback from grading"))
    graded_by = models.CharField(
        max_length=50, blank=True, help_text=_("Grading method: auto, ai, manual")
    )
    grading_metadata = models.JSONField(
        null=True,
        blank=True,
        help_text=_("Additional grading information (confidence, keywords matched, etc.)"),
    )

    # Flags
    requires_manual_review = models.BooleanField(
        default=False, help_text=_("Flag answer for manual review")
    )

    objects = SubmissionAnswerManager()

    class Meta:
        db_table = "submission_answers"
        verbose_name = _("submission answer")
        verbose_name_plural = _("submission answers")
        ordering = ["submission", "question__question_number"]
        unique_together = [["submission", "question"]]
        indexes = [
            models.Index(fields=["submission", "question"]),
            models.Index(fields=["score"]),
            models.Index(fields=["requires_manual_review"]),
        ]

    def __str__(self):
        return f"{self.submission.student.email} - Q{self.question.question_number}"

    @property
    def is_correct(self):
        """Check if answer is fully correct."""
        if self.score is None:
            return None
        return self.score == self.question.marks

    @property
    def percentage_score(self):
        """Calculate percentage score for this answer."""
        if self.score is None or self.question.marks == 0:
            return None
        return self.score / self.question.marks * 100

    def auto_grade(self):
        """
        Perform automatic grading based on question type.
        Returns True if grading was successful, False otherwise.
        """
        if self.question.question_type == "multiple_choice":
            return self._grade_multiple_choice()
        elif self.question.question_type == "true_false":
            return self._grade_true_false()
        elif self.question.question_type in ["short_answer", "essay"]:
            if self.question.use_ai_grading:
                # Will be handled by async grading service
                self.requires_manual_review = True
                self.save(update_fields=["requires_manual_review", "updated_at"])
                return False
            else:
                # Use keyword matching
                return self._grade_by_keywords()
        return False

    def _grade_multiple_choice(self):
        """Grade multiple choice question."""
        is_correct = (
            self.answer_text.strip().lower() == self.question.correct_answer.strip().lower()
        )
        self.score = self.question.marks if is_correct else 0
        self.graded_by = "auto"
        self.grading_metadata = {"method": "exact_match", "correct": is_correct}
        self.save(update_fields=["score", "graded_by", "grading_metadata", "updated_at"])
        return True

    def _grade_true_false(self):
        """Grade true/false question."""
        return self._grade_multiple_choice()  # Same logic

    def _grade_by_keywords(self):
        """Grade using keyword matching."""
        if not self.question.keywords:
            self.requires_manual_review = True
            self.save(update_fields=["requires_manual_review", "updated_at"])
            return False

        answer_lower = self.answer_text.lower()
        keywords = self.question.keywords
        matched_keywords = [kw for kw in keywords if kw.lower() in answer_lower]
        keyword_score = len(matched_keywords) / len(keywords) if keywords else 0

        # Apply keyword weight
        weight = float(self.question.keyword_weight)
        self.score = self.question.marks * keyword_score * weight
        self.graded_by = "auto_keyword"
        self.grading_metadata = {
            "method": "keyword_matching",
            "matched_keywords": matched_keywords,
            "keyword_score": keyword_score,
            "weight": weight,
        }
        self.save(update_fields=["score", "graded_by", "grading_metadata", "updated_at"])
        return True
