"""
Serializers for submissions app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Submission, SubmissionAnswer
from apps.assessments.models import Exam, Question
from apps.assessments.serializers import (
    QuestionStudentSerializer,
    ExamStudentSerializer,
)

User = get_user_model()


class SubmissionAnswerSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating submission answers."""

    class Meta:
        model = SubmissionAnswer
        fields = [
            "id",
            "submission",
            "question",
            "answer_text",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        """Validate answer data."""
        # Check if question belongs to the submission's exam
        submission = self.context.get("submission")
        question = attrs.get("question")

        if submission and question:
            if question.exam != submission.exam:
                raise serializers.ValidationError(
                    {"question": "Question does not belong to this exam."}
                )

        return attrs


class SubmissionAnswerDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for submission answers (includes grading info)."""

    question = QuestionStudentSerializer(read_only=True)
    is_correct = serializers.BooleanField(read_only=True)
    percentage_score = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )

    class Meta:
        model = SubmissionAnswer
        fields = [
            "id",
            "question",
            "answer_text",
            "score",
            "feedback",
            "graded_by",
            "grading_metadata",
            "requires_manual_review",
            "is_correct",
            "percentage_score",
            "created_at",
            "updated_at",
        ]


class SubmissionAnswerStudentSerializer(serializers.ModelSerializer):
    """Serializer for students to view their answers."""

    question = QuestionStudentSerializer(read_only=True)
    is_correct = serializers.BooleanField(read_only=True)
    percentage_score = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )

    class Meta:
        model = SubmissionAnswer
        fields = [
            "id",
            "question",
            "answer_text",
            "score",
            "feedback",
            "is_correct",
            "percentage_score",
        ]


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for student details in submissions."""

    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name"]
        read_only_fields = fields


class SubmissionSerializer(serializers.ModelSerializer):
    """Full serializer for Submission model (instructor view)."""

    student = StudentSerializer(read_only=True)
    exam = ExamStudentSerializer(read_only=True)
    answers = SubmissionAnswerDetailSerializer(many=True, read_only=True)
    is_passed = serializers.BooleanField(read_only=True)
    time_taken = serializers.DurationField(read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "student",
            "exam",
            "attempt_number",
            "status",
            "started_at",
            "submitted_at",
            "graded_at",
            "total_score",
            "percentage",
            "is_passed",
            "time_taken",
            "is_late",
            "flagged_for_review",
            "answers",
            "created_at",
            "updated_at",
        ]


class SubmissionStudentSerializer(serializers.ModelSerializer):
    """Serializer for students to view their own submissions."""

    exam = ExamStudentSerializer(read_only=True)
    answers = SubmissionAnswerStudentSerializer(many=True, read_only=True)
    is_passed = serializers.BooleanField(read_only=True)
    time_taken = serializers.DurationField(read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "exam",
            "attempt_number",
            "status",
            "started_at",
            "submitted_at",
            "graded_at",
            "total_score",
            "percentage",
            "is_passed",
            "time_taken",
            "is_late",
            "answers",
        ]


class SubmissionListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing submissions."""

    student = StudentSerializer(read_only=True)
    exam_title = serializers.CharField(source="exam.title", read_only=True)
    course_name = serializers.CharField(source="exam.course.name", read_only=True)
    is_passed = serializers.BooleanField(read_only=True)

    class Meta:
        model = Submission
        fields = [
            "id",
            "student",
            "exam_title",
            "course_name",
            "attempt_number",
            "status",
            "started_at",
            "submitted_at",
            "graded_at",
            "total_score",
            "percentage",
            "is_passed",
            "is_late",
            "flagged_for_review",
        ]


class SubmissionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new submission (starting an exam)."""

    exam_id = serializers.PrimaryKeyRelatedField(
        queryset=Exam.objects.filter(status="published"),
        source="exam",
        write_only=True,
    )

    class Meta:
        model = Submission
        fields = ["exam_id", "ip_address", "user_agent"]

    def validate_exam_id(self, value):
        """Validate exam is available."""
        exam = value
        now = timezone.now()

        # Check if exam has started
        if exam.start_time and now < exam.start_time:
            raise serializers.ValidationError("This exam has not started yet.")

        # Check if exam has ended
        if exam.end_time and now > exam.end_time:
            raise serializers.ValidationError("This exam has already ended.")

        return value

    def validate(self, attrs):
        """Validate submission creation."""
        exam = attrs.get("exam")
        student = self.context["request"].user

        # Check if student has exceeded max attempts
        if exam.max_attempts:
            attempt_count = Submission.objects.filter(
                student=student, exam=exam
            ).count()
            if attempt_count >= exam.max_attempts:
                raise serializers.ValidationError(
                    {
                        "exam_id": f"You have reached the maximum number of attempts ({exam.max_attempts}) for this exam."
                    }
                )

        # Check if student has an in-progress submission
        in_progress = Submission.objects.filter(
            student=student, exam=exam, status="in_progress"
        ).exists()
        if in_progress:
            raise serializers.ValidationError(
                {"exam_id": "You already have an in-progress submission for this exam."}
            )

        return attrs

    def create(self, validated_data):
        """Create new submission."""
        student = self.context["request"].user
        exam = validated_data["exam"]

        # Calculate attempt number
        attempt_number = (
            Submission.objects.filter(student=student, exam=exam).count() + 1
        )

        submission = Submission.objects.create(
            student=student,
            exam=exam,
            attempt_number=attempt_number,
            ip_address=validated_data.get("ip_address"),
            user_agent=validated_data.get("user_agent", ""),
        )

        return submission


class SubmissionAnswerCreateSerializer(serializers.Serializer):
    """Serializer for submitting answers."""

    answers = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField(),
            required=True,
        ),
        required=True,
        allow_empty=False,
    )

    def validate_answers(self, value):
        """Validate answers format."""
        submission = self.context.get("submission")
        if not submission:
            raise serializers.ValidationError("Submission not found.")

        exam = submission.exam
        exam_questions = set(exam.questions.values_list("id", flat=True))

        for answer in value:
            if "question_id" not in answer:
                raise serializers.ValidationError(
                    "Each answer must have a question_id."
                )
            if "answer_text" not in answer:
                raise serializers.ValidationError(
                    "Each answer must have an answer_text."
                )

            # Validate question belongs to exam
            try:
                question_id = int(answer["question_id"])
            except (ValueError, TypeError):
                raise serializers.ValidationError("Invalid question_id format.")

            if question_id not in exam_questions:
                raise serializers.ValidationError(
                    f"Question {question_id} does not belong to this exam."
                )

        return value

    def save(self):
        """Save answers and submit the submission."""
        submission = self.context["submission"]
        answers_data = self.validated_data["answers"]

        # Create or update answers
        for answer_data in answers_data:
            question_id = int(answer_data["question_id"])
            answer_text = answer_data["answer_text"]

            SubmissionAnswer.objects.update_or_create(
                submission=submission,
                question_id=question_id,
                defaults={"answer_text": answer_text},
            )

        # Submit the submission
        submission.submit()

        return submission


class SubmissionGradeSerializer(serializers.Serializer):
    """Serializer for manually grading a submission answer."""

    score = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=0, required=True
    )
    feedback = serializers.CharField(required=False, allow_blank=True)

    def validate_score(self, value):
        """Validate score doesn't exceed question marks."""
        answer = self.context.get("answer")
        if answer and value > answer.question.marks:
            raise serializers.ValidationError(
                f"Score cannot exceed {answer.question.marks} marks."
            )
        return value

    def save(self):
        """Save the grade."""
        answer = self.context["answer"]
        answer.score = self.validated_data["score"]
        answer.feedback = self.validated_data.get("feedback", "")
        answer.graded_by = "manual"
        answer.requires_manual_review = False
        answer.save(
            update_fields=[
                "score",
                "feedback",
                "graded_by",
                "requires_manual_review",
                "updated_at",
            ]
        )

        # Recalculate submission score
        submission = answer.submission
        submission.calculate_score()

        # Check if all answers are graded
        ungraded_count = submission.answers.filter(score__isnull=True).count()
        if ungraded_count == 0 and submission.status == "submitted":
            submission.mark_as_graded()

        return answer
