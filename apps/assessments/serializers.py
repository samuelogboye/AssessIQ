"""
Serializers for assessments app.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Course, Exam, Question

User = get_user_model()


class InstructorSerializer(serializers.ModelSerializer):
    """Serializer for instructor details."""

    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name"]
        read_only_fields = fields


class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model."""

    instructor = InstructorSerializer(read_only=True)
    instructor_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="instructor"),
        source="instructor",
        write_only=True,
    )
    exam_count = serializers.IntegerField(source="exams.count", read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "code",
            "name",
            "description",
            "instructor",
            "instructor_id",
            "is_active",
            "exam_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "exam_count"]

    def validate_code(self, value):
        """Validate course code is unique."""
        # Convert to uppercase first to ensure consistent comparison
        value = value.upper()

        if self.instance:
            # Update case - exclude current instance
            if Course.objects.exclude(pk=self.instance.pk).filter(code=value).exists():
                raise serializers.ValidationError("A course with this code already exists.")
        else:
            # Create case
            if Course.objects.filter(code=value).exists():
                raise serializers.ValidationError("A course with this code already exists.")
        return value


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for Question model."""

    class Meta:
        model = Question
        fields = [
            "id",
            "exam",
            "question_number",
            "question_type",
            "question_text",
            "marks",
            "options",
            "correct_answer",
            "acceptable_answers",
            "use_ai_grading",
            "grading_rubric",
            "keywords",
            "keyword_weight",
        ]

    def validate(self, attrs):
        """Validate question data."""
        if attrs.get("question_type") == "multiple_choice" and not attrs.get("options"):
            raise serializers.ValidationError(
                {"options": "Multiple choice questions must have options."}
            )
        return attrs


class QuestionListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing questions (without answers)."""

    class Meta:
        model = Question
        fields = [
            "id",
            "question_number",
            "question_type",
            "question_text",
            "marks",
            "options",
        ]


class QuestionStudentSerializer(serializers.ModelSerializer):
    """Serializer for questions visible to students (no correct answers)."""

    class Meta:
        model = Question
        fields = [
            "id",
            "question_number",
            "question_type",
            "question_text",
            "marks",
            "options",
        ]


class ExamSerializer(serializers.ModelSerializer):
    """Full serializer for Exam model (instructor view)."""

    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), source="course", write_only=True
    )
    questions = QuestionSerializer(many=True, read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    calculated_total_marks = serializers.DecimalField(
        source="calculate_total_marks", max_digits=6, decimal_places=2, read_only=True
    )

    class Meta:
        model = Exam
        fields = [
            "id",
            "title",
            "description",
            "course",
            "course_id",
            "duration_minutes",
            "total_marks",
            "calculated_total_marks",
            "passing_marks",
            "status",
            "start_time",
            "end_time",
            "instructions",
            "allow_review",
            "shuffle_questions",
            "max_attempts",
            "questions",
            "question_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "question_count"]

    def validate(self, attrs):
        """Validate exam data."""
        if attrs.get("passing_marks") and attrs.get("total_marks"):
            if attrs["passing_marks"] > attrs["total_marks"]:
                raise serializers.ValidationError(
                    {"passing_marks": "Passing marks cannot exceed total marks."}
                )

        if attrs.get("start_time") and attrs.get("end_time"):
            if attrs["start_time"] >= attrs["end_time"]:
                raise serializers.ValidationError(
                    {"end_time": "End time must be after start time."}
                )

        return attrs


class ExamListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing exams."""

    course = CourseSerializer(read_only=True)
    question_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id",
            "title",
            "description",
            "course",
            "duration_minutes",
            "total_marks",
            "passing_marks",
            "status",
            "start_time",
            "end_time",
            "question_count",
            "max_attempts",
            "created_at",
        ]


class ExamStudentSerializer(serializers.ModelSerializer):
    """Serializer for exams visible to students."""

    course = CourseSerializer(read_only=True)
    questions = QuestionStudentSerializer(many=True, read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id",
            "title",
            "description",
            "course",
            "duration_minutes",
            "total_marks",
            "passing_marks",
            "start_time",
            "end_time",
            "instructions",
            "max_attempts",
            "questions",
            "question_count",
            "is_available",
        ]


class ExamStudentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for students listing exams."""

    course = CourseSerializer(read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id",
            "title",
            "description",
            "course",
            "duration_minutes",
            "total_marks",
            "passing_marks",
            "start_time",
            "end_time",
            "max_attempts",
            "question_count",
            "is_available",
        ]


class NestedQuestionSerializer(serializers.ModelSerializer):
    """Serializer for creating questions within an exam (no exam field required)."""

    class Meta:
        model = Question
        fields = [
            "question_number",
            "question_type",
            "question_text",
            "marks",
            "options",
            "correct_answer",
            "acceptable_answers",
            "use_ai_grading",
            "grading_rubric",
            "keywords",
            "keyword_weight",
        ]

    def validate(self, attrs):
        """Validate question data."""
        if attrs.get("question_type") == "multiple_choice" and not attrs.get("options"):
            raise serializers.ValidationError(
                {"options": "Multiple choice questions must have options."}
            )
        return attrs


class ExamCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating exams with questions."""

    questions = NestedQuestionSerializer(many=True, required=False)

    class Meta:
        model = Exam
        fields = [
            "title",
            "description",
            "course",
            "duration_minutes",
            "total_marks",
            "passing_marks",
            "status",
            "start_time",
            "end_time",
            "instructions",
            "allow_review",
            "shuffle_questions",
            "max_attempts",
            "questions",
        ]

    def create(self, validated_data):
        """Create exam with questions."""
        questions_data = validated_data.pop("questions", [])
        exam = Exam.objects.create(**validated_data)

        # Create questions
        for idx, question_data in enumerate(questions_data, start=1):
            question_data["exam"] = exam
            question_data.setdefault("question_number", idx)
            Question.objects.create(**question_data)

        return exam

    def validate(self, attrs):
        """Validate exam and questions data."""
        # Validate exam fields
        if attrs.get("passing_marks") and attrs.get("total_marks"):
            if attrs["passing_marks"] > attrs["total_marks"]:
                raise serializers.ValidationError(
                    {"passing_marks": "Passing marks cannot exceed total marks."}
                )

        if attrs.get("start_time") and attrs.get("end_time"):
            if attrs["start_time"] >= attrs["end_time"]:
                raise serializers.ValidationError(
                    {"end_time": "End time must be after start time."}
                )

        # Validate questions if provided
        questions_data = attrs.get("questions", [])
        if questions_data:
            total_question_marks = sum(q.get("marks", 0) for q in questions_data)
            if total_question_marks != attrs.get("total_marks", 0):
                raise serializers.ValidationError(
                    {
                        "questions": f"Sum of question marks ({total_question_marks}) must equal total marks ({attrs.get('total_marks', 0)})."
                    }
                )

        return attrs
