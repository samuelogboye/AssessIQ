"""
URL patterns for accounts app.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # JWT Token endpoints
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
