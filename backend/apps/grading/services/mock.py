"""
Mock grading service using keyword matching and text similarity.
"""

import logging
from typing import Any

from .base import BaseGradingService

logger = logging.getLogger(__name__)


class MockGradingService(BaseGradingService):
    """
    Mock grading service that uses keyword matching and basic text similarity.
    This is a placeholder implementation for demonstration purposes.
    """

    def __init__(self, config: dict[str, Any] = None):
        """
        Initialize mock grading service.

        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.similarity_threshold = self.config.get("similarity_threshold", 0.7)

    def grade(self, submission_answer) -> dict[str, Any]:
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

        # Check for empty answer
        if not submission_answer.answer_text or not submission_answer.answer_text.strip():
            return {
                "score": 0.0,
                "score_percentage": 0.0,
                "feedback": "No answer provided.",
                "confidence": 100.0,
                "requires_manual_review": True,
                "method": "mock",
            }

        # Check for exact match first
        if student_answer == correct_answer:
            score = float(question.marks)
            confidence = 100.0
            feedback = "Perfect match! Answer is exactly correct."
        # Calculate score based on keywords if available
        elif question.keywords:
            score, feedback, confidence = self._grade_with_keywords(
                student_answer, question.keywords, question.marks, question.keyword_weight
            )
        else:
            # Use simple text similarity
            score, feedback, confidence = self._grade_with_similarity(
                student_answer, correct_answer, question.marks
            )

        # Calculate score percentage
        score_percentage = (float(score) / float(question.marks) * 100) if question.marks > 0 else 0

        # Update the submission answer
        submission_answer.score = score
        submission_answer.feedback = feedback
        submission_answer.graded_by = "mock"
        submission_answer.grading_metadata = {
            "method": "mock",
            "similarity_threshold": self.similarity_threshold,
            "confidence": confidence,
        }
        submission_answer.save()

        logger.info(f"Mock graded answer {submission_answer.id}: {score}/{question.marks}")

        return {
            "score": float(score),
            "score_percentage": score_percentage,
            "feedback": feedback,
            "confidence": confidence,
            "method": "mock",
        }

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
            tuple: (score, feedback, confidence)
        """
        matched_keywords = [kw for kw in keywords if kw.lower() in answer]
        keyword_coverage = len(matched_keywords) / len(keywords) if keywords else 0

        score = max_marks * keyword_coverage * weight

        # Calculate confidence based on keyword coverage
        confidence = keyword_coverage * 100

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

        return round(score, 2), feedback, confidence

    def _grade_with_similarity(self, answer: str, correct_answer: str, max_marks: float) -> tuple:
        """
        Grade using simple text similarity.

        Args:
            answer: Student's answer text
            correct_answer: Correct answer text
            max_marks: Maximum marks for the question

        Returns:
            tuple: (score, feedback, confidence)
        """
        # Simple word overlap similarity
        answer_words = set(answer.split())
        correct_words = set(correct_answer.split())

        if not correct_words:
            return 0, "Unable to grade: no reference answer available.", 50.0

        overlap = len(answer_words & correct_words)
        similarity = overlap / len(correct_words) if correct_words else 0

        score = max_marks * similarity

        # Calculate confidence based on similarity
        confidence = similarity * 100

        feedback = f"Text similarity score: {similarity*100:.1f}%. "
        if similarity >= 0.8:
            feedback += "Very similar to the expected answer!"
        elif similarity >= 0.5:
            feedback += "Partially correct, some key points present."
        else:
            feedback += "Answer differs significantly from expected response."

        return round(score, 2), feedback, confidence

    def validate_config(self, config: dict[str, Any]) -> bool:
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
