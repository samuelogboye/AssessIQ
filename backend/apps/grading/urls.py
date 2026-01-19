"""
URL patterns for grading app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import GradingConfigurationViewSet, GradingTaskViewSet

app_name = "grading"

# Create router for viewsets
router = DefaultRouter()
router.register(r"tasks", GradingTaskViewSet, basename="task")
router.register(r"configurations", GradingConfigurationViewSet, basename="configuration")

urlpatterns = [
    path("", include(router.urls)),
]
