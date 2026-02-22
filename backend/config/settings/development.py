"""
Development settings for AssessIQ project.
"""

from .base import *  # noqa: F403

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# CORS Settings for development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Add debug toolbar for development
INSTALLED_APPS += [ # noqa: F405
    "debug_toolbar",
]

MIDDLEWARE += [ # noqa: F405
    "debug_toolbar.middleware.DebugToolbarMiddleware",
]

# Debug toolbar configuration
INTERNAL_IPS = [
    "127.0.0.1",
    "localhost",
]

# Email backend for development (console)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Disable password validation for easier development
AUTH_PASSWORD_VALIDATORS = []

# Cache in local memory for development
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-snowflake",
    }
}
