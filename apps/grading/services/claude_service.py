"""
Claude (Anthropic) based grading service.
"""

from typing import Dict, Any
import logging
import json
from decimal import Decimal
from .base import BaseGradingService

logger = logging.getLogger(__name__)


class ClaudeGradingService(BaseGradingService):
    """
    Grading service using Anthropic's Claude models.
    Supports Claude 3.5 Sonnet, Claude 3 Opus, and other Claude models.
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize Claude grading service.

        Args:
            config: Configuration dictionary with Anthropic settings
        """
        self.config = config or {}
        self.api_key = self.config.get("api_key") or self._get_api_key_from_settings()
        self.model = self.config.get("model", "claude-3-5-sonnet-20241022")
        self.temperature = self.config.get("temperature", 0.3)
        self.max_tokens = self.config.get("max_tokens", 1024)

        if not self.api_key:
            logger.warning("Anthropic API key not configured")

    def _get_api_key_from_settings(self):
        """Get API key from Django settings."""
        from django.conf import settings
        return getattr(settings, "ANTHROPIC_API_KEY", None)

    def grade(self, submission_answer) -> Dict[str, Any]:
        """
        Grade a submission answer using Claude.

        Args:
            submission_answer: SubmissionAnswer instance to grade

        Returns:
            dict: Grading result containing score, feedback, confidence
        """
        if not self.api_key:
            logger.error("Anthropic API key not available")
            submission_answer.requires_manual_review = True
            submission_answer.save()
            return {
                "error": "Anthropic API key not configured",
                "requires_manual_review": True,
            }

        try:
            # Import Anthropic client
            try:
                from anthropic import Anthropic
            except ImportError:
                logger.error("Anthropic package not installed. Run: pip install anthropic")
                submission_answer.requires_manual_review = True
                submission_answer.save()
                return {
                    "error": "Anthropic package not installed",
                    "requires_manual_review": True,
                }

            client = Anthropic(api_key=self.api_key)
            question = submission_answer.question

            # Build prompt
            prompt = self._build_grading_prompt(submission_answer)

            # Call Claude API
            message = client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                system="You are an expert grading assistant for educational assessments. Provide fair, objective, and constructive feedback. Always respond with valid JSON.",
                messages=[{"role": "user", "content": prompt}],
            )

            # Parse response
            result_text = message.content[0].text

            # Extract JSON from response (Claude might wrap it in markdown)
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()

            result = json.loads(result_text)

            score = Decimal(str(result.get("score", 0)))
            feedback = result.get("feedback", "")
            confidence = result.get("confidence", 85.0)

            # Validate score
            if score > question.marks:
                logger.warning(
                    f"Claude returned score {score} > max marks {question.marks}, capping"
                )
                score = question.marks
            elif score < 0:
                score = Decimal("0")

            # Update submission answer
            submission_answer.score = score
            submission_answer.feedback = feedback
            submission_answer.graded_by = "claude"
            submission_answer.grading_metadata = {
                "method": "claude",
                "model": self.model,
                "confidence": confidence,
                "input_tokens": message.usage.input_tokens,
                "output_tokens": message.usage.output_tokens,
                "stop_reason": message.stop_reason,
            }
            submission_answer.save()

            logger.info(
                f"Claude graded answer {submission_answer.id}: {score}/{question.marks}"
            )

            return {
                "score": float(score),
                "feedback": feedback,
                "confidence": confidence,
                "method": "claude",
                "input_tokens": message.usage.input_tokens,
                "output_tokens": message.usage.output_tokens,
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude response: {e}")
            submission_answer.requires_manual_review = True
            submission_answer.save()
            return {"error": "Failed to parse AI response", "requires_manual_review": True}

        except Exception as e:
            logger.error(f"Claude grading error: {e}")
            submission_answer.requires_manual_review = True
            submission_answer.save()
            return {"error": str(e), "requires_manual_review": True}

    def _build_grading_prompt(self, submission_answer) -> str:
        """
        Build grading prompt for Claude.

        Args:
            submission_answer: SubmissionAnswer instance

        Returns:
            str: Formatted prompt
        """
        question = submission_answer.question
        student_answer = submission_answer.answer_text

        prompt = f"""Grade the following student answer for this question.

Question Type: {question.get_question_type_display()}
Question: {question.question_text}
Maximum Marks: {question.marks}

Student's Answer:
{student_answer}

"""

        # Add reference materials if available
        if question.correct_answer:
            prompt += f"""Reference Answer (for guidance, not exact match required):
{question.correct_answer}

"""

        if question.grading_rubric:
            prompt += f"""Grading Rubric:
{question.grading_rubric}

"""

        if question.keywords:
            prompt += f"""Key Concepts to Look For:
{', '.join(question.keywords)}

"""

        # Add grading instructions
        prompt += """Please provide your grading in the following JSON format:
{
  "score": <numerical score between 0 and maximum marks>,
  "feedback": "<constructive feedback explaining the score, highlighting strengths and areas for improvement>",
  "confidence": <confidence level 0-100>
}

Grading Guidelines:
- Be fair and objective
- Award partial credit for partially correct answers
- Focus on understanding and reasoning, not just exact wording
- Provide specific, actionable feedback
- Consider the question type and rubric if provided
- Ensure your response is valid JSON"""

        return prompt

    def validate_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate Claude service configuration.

        Args:
            config: Configuration dictionary

        Returns:
            bool: True if configuration is valid
        """
        # Check API key
        api_key = config.get("api_key") or self._get_api_key_from_settings()
        if not api_key:
            logger.error("Anthropic API key not provided")
            return False

        # Validate model if specified
        valid_models = [
            "claude-3-5-sonnet-20241022",
            "claude-3-5-sonnet-20240620",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307",
        ]
        model = config.get("model")
        if model and model not in valid_models:
            logger.warning(f"Unknown Claude model: {model}")

        # Validate temperature
        temperature = config.get("temperature")
        if temperature is not None and not (0 <= temperature <= 1):
            logger.error(f"Invalid temperature: {temperature} (must be 0-1)")
            return False

        # Validate max_tokens
        max_tokens = config.get("max_tokens")
        if max_tokens is not None and (max_tokens < 1 or max_tokens > 4096):
            logger.error(f"Invalid max_tokens: {max_tokens}")
            return False

        return True
