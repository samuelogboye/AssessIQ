"""
URL patterns for grading app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GradingTaskViewSet, GradingConfigurationViewSet

app_name = "grading"

# Create router for viewsets
router = DefaultRouter()
router.register(r"tasks", GradingTaskViewSet, basename="task")
router.register(r"configurations", GradingConfigurationViewSet, basename="configuration")

urlpatterns = [
    path("", include(router.urls)),
]
