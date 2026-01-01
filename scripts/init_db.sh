#!/bin/bash

# Database initialization script for AssessIQ

set -e

echo "Initializing database..."
echo "======================="
echo ""

# Wait for database to be ready
echo "Waiting for database..."
while ! python manage.py check --database default 2>/dev/null; do
    echo "Database unavailable - sleeping"
    sleep 1
done
echo "Database is ready!"
echo ""

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput
echo ""

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear
echo ""

# Create cache table if using database cache
# python manage.py createcachetable

echo "Database initialization complete!"
