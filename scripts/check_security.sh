#!/bin/bash

# Security checks script for AssessIQ

set -e

echo "Running security checks..."
echo "=========================="
echo ""

# Check for common security issues with Bandit
echo "1. Running Bandit security scanner..."
bandit -r apps/ -ll -f json -o bandit-report.json || true
bandit -r apps/ -ll
echo ""

# Check for known vulnerabilities in dependencies
echo "2. Checking dependencies for vulnerabilities..."
safety check --json || true
echo ""

# Django deployment checklist
echo "3. Running Django deployment checks..."
python manage.py check --deploy --settings=config.settings.production
echo ""

# Check for secrets in code
echo "4. Checking for potential secrets..."
if command -v detect-secrets &> /dev/null; then
    detect-secrets scan --baseline .secrets.baseline
else
    echo "detect-secrets not installed, skipping..."
fi
echo ""

echo "Security checks complete!"
echo "Review bandit-report.json for detailed findings."
