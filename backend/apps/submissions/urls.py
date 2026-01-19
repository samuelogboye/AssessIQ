"""
URL patterns for submissions app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SubmissionAnswerViewSet, SubmissionViewSet

app_name = "submissions"

# Create router for viewsets
router = DefaultRouter()
router.register(r"submissions", SubmissionViewSet, basename="submission")
router.register(r"answers", SubmissionAnswerViewSet, basename="answer")

urlpatterns = [
    path("", include(router.urls)),
]
