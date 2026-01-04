"""
URL patterns for assessments app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CourseViewSet, ExamViewSet, QuestionViewSet, StudentExamViewSet

app_name = "assessments"

# Create router for viewsets
router = DefaultRouter()
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"exams", ExamViewSet, basename="exam")
router.register(r"student-exams", StudentExamViewSet, basename="student-exam")
router.register(r"questions", QuestionViewSet, basename="question")

urlpatterns = [
    path("", include(router.urls)),
]
