"""
URL patterns for submissions app.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SubmissionAnswerViewSet, SubmissionViewSet, dashboard_stats

app_name = "submissions"

# Create router for viewsets
router = DefaultRouter()
router.register(r"submissions", SubmissionViewSet, basename="submission")
router.register(r"answers", SubmissionAnswerViewSet, basename="answer")

urlpatterns = [
    # Dashboard stats endpoint at /submissions/dashboard/stats/
    path("dashboard/stats/", dashboard_stats, name="dashboard-stats"),
    # Router URLs
    path("", include(router.urls)),
]
