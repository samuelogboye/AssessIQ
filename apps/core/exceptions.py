"""
Custom exception handlers for AssessIQ.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error responses.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Customize the response format
        custom_response_data = {
            "error": True,
            "message": str(exc),
            "detail": response.data,
            "status_code": response.status_code,
        }

        # Log the error
        logger.error(
            f"API Error: {exc}",
            extra={
                "status_code": response.status_code,
                "path": context["request"].path,
                "method": context["request"].method,
            },
        )

        response.data = custom_response_data

    return response
