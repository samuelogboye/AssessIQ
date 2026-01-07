"""
Base grading service and factory.
"""

import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)


class BaseGradingService(ABC):
    """
    Abstract base class for grading services.
    All grading implementations must inherit from this class.
    """

    @abstractmethod
    def grade(self, submission_answer) -> dict[str, Any]:
        """
        Grade a submission answer.

        Args:
            submission_answer: SubmissionAnswer instance to grade

        Returns:
            dict: Grading result containing score, feedback, confidence, etc.
        """
        pass

    @abstractmethod
    def validate_config(self, config: dict[str, Any]) -> bool:
        """
        Validate service configuration.

        Args:
            config: Configuration dictionary

        Returns:
            bool: True if configuration is valid
        """
        pass


class GradingService:
    """
    Factory class for grading services.
    Provides a unified interface to get appropriate grading service.
    """

    _services = {}

    @classmethod
    def register(cls, name: str, service_class: type):
        """
        Register a grading service.

        Args:
            name: Service name
            service_class: Service class (must inherit from BaseGradingService)
        """
        if not issubclass(service_class, BaseGradingService):
            raise ValueError(f"{service_class} must inherit from BaseGradingService")

        cls._services[name] = service_class
        logger.info(f"Registered grading service: {name}")

    @classmethod
    def get_service(cls, service_name=None, question=None, config=None):
        """
        Get appropriate grading service based on service name, question or configuration.

        Args:
            service_name: Service name (optional, overrides other parameters)
            question: Question instance (optional)
            config: Configuration dictionary (optional)

        Returns:
            BaseGradingService: Instance of grading service
        """
        from django.conf import settings

        from .mock import MockGradingService

        # Register default services if not already registered
        if "mock" not in cls._services:
            cls.register("mock", MockGradingService)

        # Determine which service to use
        if not service_name:
            service_name = settings.GRADING_SERVICE

            if question:
                # Check for question-specific configuration
                from apps.grading.models import GradingConfiguration

                try:
                    grading_config = GradingConfiguration.objects.filter(
                        question=question, is_active=True
                    ).first()

                    if not grading_config:
                        # Try exam-level config
                        grading_config = GradingConfiguration.objects.filter(
                            exam=question.exam, is_active=True
                        ).first()

                    if not grading_config:
                        # Use global config
                        grading_config = GradingConfiguration.objects.filter(
                            scope="global", is_active=True
                        ).first()

                    if grading_config:
                        service_name = grading_config.grading_service
                        config = grading_config.service_config

                except Exception as e:
                    logger.warning(f"Error fetching grading config: {e}")

        # Get service class
        service_class = cls._services.get(service_name)

        if not service_class:
            logger.warning(f"Service {service_name} not found, falling back to mock")
            service_class = cls._services.get("mock")

        # Instantiate and return service
        return service_class(config or {})
