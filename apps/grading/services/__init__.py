"""
Grading services package.
Provides access to all grading service implementations.
"""

from .base import BaseGradingService, GradingService
from .mock import MockGradingService
from .openai_service import OpenAIGradingService
from .claude_service import ClaudeGradingService
from .gemini_service import GeminiGradingService

# Register all available grading services
GradingService.register("mock", MockGradingService)
GradingService.register("openai", OpenAIGradingService)
GradingService.register("claude", ClaudeGradingService)
GradingService.register("gemini", GeminiGradingService)

__all__ = [
    "BaseGradingService",
    "GradingService",
    "MockGradingService",
    "OpenAIGradingService",
    "ClaudeGradingService",
    "GeminiGradingService",
]
