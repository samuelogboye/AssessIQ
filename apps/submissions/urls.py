"""
URL patterns for submissions app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubmissionViewSet, SubmissionAnswerViewSet

app_name = "submissions"

# Create router for viewsets
router = DefaultRouter()
router.register(r"submissions", SubmissionViewSet, basename="submission")
router.register(r"answers", SubmissionAnswerViewSet, basename="answer")

urlpatterns = [
    path("", include(router.urls)),
]
