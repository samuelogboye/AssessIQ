"""
Mock grading service using keyword matching and text similarity.
"""

from typing import Dict, Any
import logging
from .base import BaseGradingService

logger = logging.getLogger(__name__)


class MockGradingService(BaseGradingService):
    """
    Mock grading service that uses keyword matching and basic text similarity.
    This is a placeholder implementation for demonstration purposes.
    """

    def __init__(self, config: Dict[str, Any] = None):
        """
        Initialize mock grading service.

        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.similarity_threshold = self.config.get("similarity_threshold", 0.7)

    def grade(self, submission_answer) -> Dict[str, Any]:
        """
        Grade a submission answer using keyword matching and similarity.

        Args:
            submission_answer: SubmissionAnswer instance to grade

        Returns:
            dict: Grading result
        """
        question = submission_answer.question
        student_answer = submission_answer.answer_text.lower()
        correct_answer = question.correct_answer.lower()

        # Calculate score based on keywords if available
        if question.keywords:
            score, feedback = self._grade_with_keywords(
                student_answer, question.keywords, question.marks, question.keyword_weight
            )
        else:
            # Use simple text similarity
            score, feedback = self._grade_with_similarity(
                student_answer, correct_answer, question.marks
            )

        # Update the submission answer
        submission_answer.score = score
        submission_answer.feedback = feedback
        submission_answer.graded_by = "mock"
        submission_answer.grading_metadata = {
            "method": "mock",
            "similarity_threshold": self.similarity_threshold,
            "confidence": 75.0,  # Mock confidence score
        }
        submission_answer.save()

        logger.info(f"Mock graded answer {submission_answer.id}: {score}/{question.marks}")

        return {"score": float(score), "feedback": feedback, "confidence": 75.0, "method": "mock"}

    def _grade_with_keywords(
        self, answer: str, keywords: list, max_marks: float, weight: float
    ) -> tuple:
        """
        Grade using keyword matching.

        Args:
            answer: Student's answer text
            keywords: List of keywords to match
            max_marks: Maximum marks for the question
            weight: Weight of keyword matching (0-1)

        Returns:
            tuple: (score, feedback)
        """
        matched_keywords = [kw for kw in keywords if kw.lower() in answer]
        keyword_coverage = len(matched_keywords) / len(keywords) if keywords else 0

        score = max_marks * keyword_coverage * weight

        feedback = f"Keyword matching score: {keyword_coverage*100:.1f}%. "
        if matched_keywords:
            feedback += f"Matched keywords: {', '.join(matched_keywords[:5])}. "
        else:
            feedback += "No keywords matched. "

        if keyword_coverage >= 0.8:
            feedback += "Excellent coverage of key concepts!"
        elif keyword_coverage >= 0.5:
            feedback += "Good understanding, but some key points are missing."
        else:
            feedback += "Answer lacks several important concepts."

        return round(score, 2), feedback

    def _grade_with_similarity(self, answer: str, correct_answer: str, max_marks: float) -> tuple:
        """
        Grade using simple text similarity.

        Args:
            answer: Student's answer text
            correct_answer: Correct answer text
            max_marks: Maximum marks for the question

        Returns:
            tuple: (score, feedback)
        """
        # Simple word overlap similarity
        answer_words = set(answer.split())
        correct_words = set(correct_answer.split())

        if not correct_words:
            return 0, "Unable to grade: no reference answer available."

        overlap = len(answer_words & correct_words)
        similarity = overlap / len(correct_words) if correct_words else 0

        score = max_marks * similarity

        feedback = f"Text similarity score: {similarity*100:.1f}%. "
        if similarity >= 0.8:
            feedback += "Very similar to the expected answer!"
        elif similarity >= 0.5:
            feedback += "Partially correct, some key points present."
        else:
            feedback += "Answer differs significantly from expected response."

        return round(score, 2), feedback

    def validate_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate service configuration.

        Args:
            config: Configuration dictionary

        Returns:
            bool: True if configuration is valid
        """
        # Mock service has minimal configuration requirements
        if "similarity_threshold" in config:
            threshold = config["similarity_threshold"]
            if not (0 <= threshold <= 1):
                return False

        return True
