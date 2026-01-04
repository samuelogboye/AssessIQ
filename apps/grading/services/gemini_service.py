"""
Google Gemini based grading service.
"""

import json
import logging
from decimal import Decimal
from typing import Any, Dict

from .base import BaseGradingService

logger = logging.getLogger(__name__)


class GeminiGradingService(BaseGradingService):
    """
    Grading service using Google's Gemini models.
    Supports Gemini Pro, Gemini Pro Vision, and other Gemini models.
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize Gemini grading service.

        Args:
            config: Configuration dictionary with Google AI settings
        """
        self.config = config or {}
        self.api_key = self.config.get("api_key") or self._get_api_key_from_settings()
        self.model_name = self.config.get("model", "gemini-1.5-flash")
        self.temperature = self.config.get("temperature", 0.3)
        self.max_tokens = self.config.get("max_tokens", 1024)

        if not self.api_key:
            logger.warning("Google API key not configured")

    def _get_api_key_from_settings(self):
        """Get API key from Django settings."""
        from django.conf import settings

        return getattr(settings, "GOOGLE_API_KEY", None)

    def grade(self, submission_answer) -> Dict[str, Any]:
        """
        Grade a submission answer using Gemini.

        Args:
            submission_answer: SubmissionAnswer instance to grade

        Returns:
            dict: Grading result containing score, feedback, confidence
        """
        if not self.api_key:
            logger.error("Google API key not available")
            submission_answer.requires_manual_review = True
            submission_answer.save()
            return {
                "error": "Google API key not configured",
                "requires_manual_review": True,
            }

        try:
            # Import Google Generative AI
            try:
                import google.generativeai as genai
            except ImportError:
                logger.error(
                    "Google Generative AI package not installed. Run: pip install google-generativeai"
                )
                submission_answer.requires_manual_review = True
                submission_answer.save()
                return {
                    "error": "Google Generative AI package not installed",
                    "requires_manual_review": True,
                }

            # Configure API
            genai.configure(api_key=self.api_key)

            # Create model
            generation_config = {
                "temperature": self.temperature,
                "max_output_tokens": self.max_tokens,
                "response_mime_type": "application/json",
            }

            model = genai.GenerativeModel(
                model_name=self.model_name,
                generation_config=generation_config,
            )

            question = submission_answer.question

            # Build prompt
            prompt = self._build_grading_prompt(submission_answer)

            # Call Gemini API
            response = model.generate_content(prompt)

            # Parse response
            result_text = response.text

            try:
                result = json.loads(result_text)
            except json.JSONDecodeError:
                # Try to extract JSON from markdown if wrapped
                if "```json" in result_text:
                    result_text = result_text.split("```json")[1].split("```")[0].strip()
                elif "```" in result_text:
                    result_text = result_text.split("```")[1].split("```")[0].strip()
                result = json.loads(result_text)

            score = Decimal(str(result.get("score", 0)))
            feedback = result.get("feedback", "")
            confidence = result.get("confidence", 80.0)

            # Validate score
            if score > question.marks:
                logger.warning(
                    f"Gemini returned score {score} > max marks {question.marks}, capping"
                )
                score = question.marks
            elif score < 0:
                score = Decimal("0")

            # Update submission answer
            submission_answer.score = score
            submission_answer.feedback = feedback
            submission_answer.graded_by = "gemini"
            submission_answer.grading_metadata = {
                "method": "gemini",
                "model": self.model_name,
                "confidence": confidence,
                "prompt_tokens": (
                    response.usage_metadata.prompt_token_count
                    if hasattr(response, "usage_metadata")
                    else None
                ),
                "completion_tokens": (
                    response.usage_metadata.candidates_token_count
                    if hasattr(response, "usage_metadata")
                    else None
                ),
                "finish_reason": (
                    response.candidates[0].finish_reason.name if response.candidates else None
                ),
            }
            submission_answer.save()

            logger.info(f"Gemini graded answer {submission_answer.id}: {score}/{question.marks}")

            return {
                "score": float(score),
                "feedback": feedback,
                "confidence": confidence,
                "method": "gemini",
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            submission_answer.requires_manual_review = True
            submission_answer.save()
            return {"error": "Failed to parse AI response", "requires_manual_review": True}

        except Exception as e:
            logger.error(f"Gemini grading error: {e}")
            submission_answer.requires_manual_review = True
            submission_answer.save()
            return {"error": str(e), "requires_manual_review": True}

    def _build_grading_prompt(self, submission_answer) -> str:
        """
        Build grading prompt for Gemini.

        Args:
            submission_answer: SubmissionAnswer instance

        Returns:
            str: Formatted prompt
        """
        question = submission_answer.question
        student_answer = submission_answer.answer_text

        prompt = f"""You are an expert grading assistant for educational assessments. Grade the following student answer fairly and objectively.

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
- Return ONLY valid JSON, no additional text or markdown"""

        return prompt

    def validate_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate Gemini service configuration.

        Args:
            config: Configuration dictionary

        Returns:
            bool: True if configuration is valid
        """
        # Check API key
        api_key = config.get("api_key") or self._get_api_key_from_settings()
        if not api_key:
            logger.error("Google API key not provided")
            return False

        # Validate model if specified
        valid_models = [
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-1.0-pro",
        ]
        model = config.get("model")
        if model and model not in valid_models:
            logger.warning(f"Unknown Gemini model: {model}")

        # Validate temperature
        temperature = config.get("temperature")
        if temperature is not None and not (0 <= temperature <= 2):
            logger.error(f"Invalid temperature: {temperature} (must be 0-2)")
            return False

        # Validate max_tokens
        max_tokens = config.get("max_tokens")
        if max_tokens is not None and max_tokens < 1:
            logger.error(f"Invalid max_tokens: {max_tokens}")
            return False

        return True
