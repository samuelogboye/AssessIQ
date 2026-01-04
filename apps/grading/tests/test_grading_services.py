"""
Tests for grading services.
"""

from unittest.mock import MagicMock, Mock, patch

import pytest
from django.contrib.auth import get_user_model

from apps.assessments.models import Course, Exam, Question
from apps.grading.services import GradingService
from apps.grading.services.mock_service import MockGradingService
from apps.submissions.models import Submission, SubmissionAnswer

User = get_user_model()


@pytest.fixture
def instructor():
    """Create an instructor user."""
    return User.objects.create_user(
        email="instructor@test.com",
        password="TestPass123!",
        role="instructor",
        first_name="Test",
        last_name="Instructor",
        is_verified=True,
    )


@pytest.fixture
def student():
    """Create a student user."""
    return User.objects.create_user(
        email="student@test.com",
        password="TestPass123!",
        role="student",
        first_name="Test",
        last_name="Student",
        is_verified=True,
    )


@pytest.fixture
def course(instructor):
    """Create a course."""
    return Course.objects.create(
        title="Test Course",
        code="CS101",
        description="Test course description",
        instructor=instructor,
    )


@pytest.fixture
def exam(course):
    """Create an exam."""
    return Exam.objects.create(
        course=course,
        title="Test Exam",
        description="Test exam description",
        total_marks=100,
        passing_marks=60,
        duration_minutes=60,
    )


@pytest.fixture
def question(exam):
    """Create a question."""
    return Question.objects.create(
        exam=exam,
        question_text="What is the capital of France?",
        question_type="short_answer",
        marks=10,
        reference_answer="Paris",
        keywords=["Paris", "capital", "France"],
    )


@pytest.fixture
def submission(exam, student):
    """Create a submission."""
    return Submission.objects.create(
        exam=exam,
        student=student,
        status="submitted",
    )


@pytest.fixture
def submission_answer(submission, question):
    """Create a submission answer."""
    return SubmissionAnswer.objects.create(
        submission=submission,
        question=question,
        answer_text="The capital of France is Paris.",
    )


@pytest.mark.django_db
class TestMockGradingService:
    """Tests for MockGradingService."""

    def test_exact_match(self, submission_answer):
        """Test exact match grading."""
        submission_answer.answer_text = "Paris"

        service = MockGradingService()
        result = service.grade(submission_answer)

        assert result["score"] == 10.0
        assert result["score_percentage"] == 100.0
        assert "feedback" in result
        assert result["confidence"] >= 90

    def test_partial_match(self, submission_answer):
        """Test partial match grading."""
        submission_answer.answer_text = "I think it's Paris"

        service = MockGradingService()
        result = service.grade(submission_answer)

        assert result["score"] > 0
        assert result["score"] < 10
        assert "feedback" in result

    def test_no_match(self, submission_answer):
        """Test no match grading."""
        submission_answer.answer_text = "London"

        service = MockGradingService()
        result = service.grade(submission_answer)

        assert result["score"] == 0.0
        assert "feedback" in result

    def test_empty_answer(self, submission_answer):
        """Test empty answer grading."""
        submission_answer.answer_text = ""

        service = MockGradingService()
        result = service.grade(submission_answer)

        assert result["score"] == 0.0
        assert result["requires_manual_review"] is True


@pytest.mark.django_db
class TestOpenAIGradingService:
    """Tests for OpenAIGradingService."""

    @patch("apps.grading.services.openai_service.OpenAI")
    def test_successful_grading(self, mock_openai_class, submission_answer):
        """Test successful OpenAI grading."""
        # Mock the OpenAI client
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client

        # Mock the API response
        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(
                message=MagicMock(
                    content='{"score": 9.0, "feedback": "Excellent answer!", "confidence": 95}'
                )
            )
        ]
        mock_response.usage = MagicMock(
            prompt_tokens=100,
            completion_tokens=50,
            total_tokens=150,
        )
        mock_client.chat.completions.create.return_value = mock_response

        from apps.grading.services.openai_service import OpenAIGradingService

        service = OpenAIGradingService(config={"api_key": "test-key"})
        result = service.grade(submission_answer)

        assert result["score"] == 9.0
        assert result["feedback"] == "Excellent answer!"
        assert result["confidence"] == 95
        assert result["metadata"]["tokens_used"] == 150

    @patch("apps.grading.services.openai_service.OpenAI")
    def test_api_error_handling(self, mock_openai_class, submission_answer):
        """Test OpenAI API error handling."""
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client

        # Mock API error
        mock_client.chat.completions.create.side_effect = Exception("API Error")

        from apps.grading.services.openai_service import OpenAIGradingService

        service = OpenAIGradingService(config={"api_key": "test-key"})
        result = service.grade(submission_answer)

        assert result["score"] == 0.0
        assert result["requires_manual_review"] is True
        assert "error" in result
        assert "API Error" in result["error"]

    @patch("apps.grading.services.openai_service.OpenAI")
    def test_invalid_json_response(self, mock_openai_class, submission_answer):
        """Test handling of invalid JSON response."""
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client

        # Mock invalid JSON response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="This is not JSON"))]
        mock_response.usage = MagicMock(total_tokens=100)
        mock_client.chat.completions.create.return_value = mock_response

        from apps.grading.services.openai_service import OpenAIGradingService

        service = OpenAIGradingService(config={"api_key": "test-key"})
        result = service.grade(submission_answer)

        assert result["requires_manual_review"] is True


@pytest.mark.django_db
class TestClaudeGradingService:
    """Tests for ClaudeGradingService."""

    @patch("apps.grading.services.claude_service.Anthropic")
    def test_successful_grading(self, mock_anthropic_class, submission_answer):
        """Test successful Claude grading."""
        mock_client = MagicMock()
        mock_anthropic_class.return_value = mock_client

        # Mock the API response
        mock_response = MagicMock()
        mock_response.content = [
            MagicMock(text='{"score": 8.5, "feedback": "Good answer!", "confidence": 90}')
        ]
        mock_response.usage = MagicMock(
            input_tokens=100,
            output_tokens=50,
        )
        mock_client.messages.create.return_value = mock_response

        from apps.grading.services.claude_service import ClaudeGradingService

        service = ClaudeGradingService(config={"api_key": "test-key"})
        result = service.grade(submission_answer)

        assert result["score"] == 8.5
        assert result["feedback"] == "Good answer!"
        assert result["confidence"] == 90

    @patch("apps.grading.services.claude_service.Anthropic")
    def test_markdown_wrapped_json(self, mock_anthropic_class, submission_answer):
        """Test handling of markdown-wrapped JSON response."""
        mock_client = MagicMock()
        mock_anthropic_class.return_value = mock_client

        # Mock response with markdown-wrapped JSON
        mock_response = MagicMock()
        mock_response.content = [
            MagicMock(text='```json\n{"score": 7.0, "feedback": "Nice!", "confidence": 85}\n```')
        ]
        mock_response.usage = MagicMock(input_tokens=100, output_tokens=50)
        mock_client.messages.create.return_value = mock_response

        from apps.grading.services.claude_service import ClaudeGradingService

        service = ClaudeGradingService(config={"api_key": "test-key"})
        result = service.grade(submission_answer)

        assert result["score"] == 7.0


@pytest.mark.django_db
class TestGeminiGradingService:
    """Tests for GeminiGradingService."""

    @patch("apps.grading.services.gemini_service.genai")
    def test_successful_grading(self, mock_genai, submission_answer):
        """Test successful Gemini grading."""
        # Mock the model and response
        mock_model = MagicMock()
        mock_genai.GenerativeModel.return_value = mock_model

        mock_response = MagicMock()
        mock_response.text = '{"score": 9.5, "feedback": "Perfect!", "confidence": 98}'
        mock_response.usage_metadata = MagicMock(
            prompt_token_count=100,
            candidates_token_count=50,
            total_token_count=150,
        )
        mock_model.generate_content.return_value = mock_response

        from apps.grading.services.gemini_service import GeminiGradingService

        service = GeminiGradingService(config={"api_key": "test-key"})
        result = service.grade(submission_answer)

        assert result["score"] == 9.5
        assert result["feedback"] == "Perfect!"
        assert result["confidence"] == 98


@pytest.mark.django_db
class TestGradingServiceFactory:
    """Tests for GradingService factory."""

    def test_get_mock_service(self):
        """Test getting mock service."""
        service = GradingService.get_service(service_name="mock")
        assert isinstance(service, MockGradingService)

    def test_service_registration(self):
        """Test service registration."""
        assert "mock" in GradingService._services
        assert "openai" in GradingService._services
        assert "claude" in GradingService._services
        assert "gemini" in GradingService._services

    def test_default_service(self):
        """Test default service fallback."""
        service = GradingService.get_service(service_name="nonexistent")
        # Should fall back to mock service
        assert isinstance(service, MockGradingService)


@pytest.mark.django_db
class TestServiceConfiguration:
    """Tests for service configuration."""

    def test_openai_config_validation(self):
        """Test OpenAI configuration validation."""
        from apps.grading.services.openai_service import OpenAIGradingService

        config = {
            "model": "gpt-4o-mini",
            "temperature": 0.3,
            "max_tokens": 500,
        }

        service = OpenAIGradingService(config=config)
        assert service.model == "gpt-4o-mini"
        assert service.temperature == 0.3
        assert service.max_tokens == 500

    def test_claude_config_validation(self):
        """Test Claude configuration validation."""
        from apps.grading.services.claude_service import ClaudeGradingService

        config = {
            "model": "claude-3-5-sonnet-20241022",
            "temperature": 0.2,
            "max_tokens": 1024,
        }

        service = ClaudeGradingService(config=config)
        assert service.model == "claude-3-5-sonnet-20241022"
        assert service.temperature == 0.2
        assert service.max_tokens == 1024

    def test_gemini_config_validation(self):
        """Test Gemini configuration validation."""
        from apps.grading.services.gemini_service import GeminiGradingService

        config = {
            "model": "gemini-1.5-flash",
            "temperature": 0.3,
            "max_tokens": 1024,
        }

        service = GeminiGradingService(config=config)
        assert service.model_name == "gemini-1.5-flash"
        assert service.temperature == 0.3
        assert service.max_tokens == 1024
