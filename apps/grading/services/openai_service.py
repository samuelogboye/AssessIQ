"""
OpenAI-based grading service using GPT models.
"""

from typing import Dict, Any
import logging
import json
from decimal import Decimal
from .base import BaseGradingService

logger = logging.getLogger(__name__)


class OpenAIGradingService(BaseGradingService):
    """
    Grading service using OpenAI GPT models.
    Supports GPT-4, GPT-3.5-turbo, and other OpenAI models.
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize OpenAI grading service.

        Args:
            config: Configuration dictionary with OpenAI settings
        """
        self.config = config or {}
        self.api_key = self.config.get("api_key") or self._get_api_key_from_settings()
        self.model = self.config.get("model", "gpt-4o-mini")
        self.temperature = self.config.get("temperature", 0.3)
        self.max_tokens = self.config.get("max_tokens", 500)

        if not self.api_key:
            logger.warning("OpenAI API key not configured")

    def _get_api_key_from_settings(self):
        """Get API key from Django settings."""
        from django.conf import settings
        return getattr(settings, "OPENAI_API_KEY", None)

    def grade(self, submission_answer) -> Dict[str, Any]:
        """
        Grade a submission answer using OpenAI GPT.

        Args:
            submission_answer: SubmissionAnswer instance to grade

        Returns:
            dict: Grading result containing score, feedback, confidence
        """
        if not self.api_key:
            logger.error("OpenAI API key not available")
            submission_answer.requires_manual_review = True
            submission_answer.save()
            return {
                "error": "OpenAI API key not configured",
                "requires_manual_review": True,
            }

        try:
            # Import OpenAI client
            try:
                from openai import OpenAI
            except ImportError:
                logger.error("OpenAI package not installed. Run: pip install openai")
                submission_answer.requires_manual_review = True
                submission_answer.save()
                return {
                    "error": "OpenAI package not installed",
                    "requires_manual_review": True,
                }

            client = OpenAI(api_key=self.api_key)
            question = submission_answer.question

            # Build prompt
            prompt = self._build_grading_prompt(submission_answer)

            # Call OpenAI API
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert grading assistant for educational assessments. Provide fair, objective, and constructive feedback.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"},
            )

            # Parse response
            result_text = response.choices[0].message.content
            result = json.loads(result_text)

            score = Decimal(str(result.get("score", 0)))
            feedback = result.get("feedback", "")
            confidence = result.get("confidence", 80.0)

            # Validate score
            if score > question.marks:
                logger.warning(
                    f"OpenAI returned score {score} > max marks {question.marks}, capping"
                )
                score = question.marks
            elif score < 0:
                score = Decimal("0")

            # Update submission answer
            submission_answer.score = score
            submission_answer.feedback = feedback
            submission_answer.graded_by = "openai"
            submission_answer.grading_metadata = {
                "method": "openai",
                "model": self.model,
                "confidence": confidence,
                "tokens_used": response.usage.total_tokens,
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
            }
            submission_answer.save()

            logger.info(
                f"OpenAI graded answer {submission_answer.id}: {score}/{question.marks}"
            )

            return {
                "score": float(score),
                "feedback": feedback,
                "confidence": confidence,
                "method": "openai",
                "tokens_used": response.usage.total_tokens,
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI response: {e}")
            submission_answer.requires_manual_review = True
            submission_answer.save()
            return {"error": "Failed to parse AI response", "requires_manual_review": True}

        except Exception as e:
            logger.error(f"OpenAI grading error: {e}")
            submission_answer.requires_manual_review = True
            submission_answer.save()
            return {"error": str(e), "requires_manual_review": True}

    def _build_grading_prompt(self, submission_answer) -> str:
        """
        Build grading prompt for OpenAI.

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
- Consider the question type and rubric if provided"""

        return prompt

    def validate_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate OpenAI service configuration.

        Args:
            config: Configuration dictionary

        Returns:
            bool: True if configuration is valid
        """
        # Check API key
        api_key = config.get("api_key") or self._get_api_key_from_settings()
        if not api_key:
            logger.error("OpenAI API key not provided")
            return False

        # Validate model if specified
        valid_models = [
            "gpt-4",
            "gpt-4-turbo",
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-3.5-turbo",
        ]
        model = config.get("model")
        if model and model not in valid_models:
            logger.warning(f"Unknown OpenAI model: {model}")

        # Validate temperature
        temperature = config.get("temperature")
        if temperature is not None and not (0 <= temperature <= 2):
            logger.error(f"Invalid temperature: {temperature} (must be 0-2)")
            return False

        # Validate max_tokens
        max_tokens = config.get("max_tokens")
        if max_tokens is not None and (max_tokens < 1 or max_tokens > 4000):
            logger.error(f"Invalid max_tokens: {max_tokens}")
            return False

        return True
