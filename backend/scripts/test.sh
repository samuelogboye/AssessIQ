#!/bin/bash

# Test runner script for AssessIQ

set -e

echo "Running tests..."
echo "==============="
echo ""

# Set Django settings module for testing
export DJANGO_SETTINGS_MODULE=config.settings.testing

# Run tests with coverage
pytest \
    --cov=apps \
    --cov-report=html \
    --cov-report=term-missing \
    --cov-report=xml \
    --verbose \
    "$@"

echo ""
echo "Tests complete!"
echo "Coverage report available at: htmlcov/index.html"
