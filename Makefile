.PHONY: help install dev-install migrate makemigrations createsuperuser shell test coverage lint format security run docker-up docker-down docker-build docker-logs clean

help:
	@echo "AssessIQ Development Commands"
	@echo "=============================="
	@echo "install          - Install production dependencies"
	@echo "dev-install      - Install development dependencies"
	@echo "migrate          - Run database migrations"
	@echo "makemigrations   - Create new migrations"
	@echo "createsuperuser  - Create a superuser"
	@echo "shell            - Open Django shell"
	@echo "test             - Run tests"
	@echo "coverage         - Run tests with coverage report"
	@echo "lint             - Run code linters"
	@echo "format           - Format code with black and isort"
	@echo "security         - Run security checks"
	@echo "run              - Run development server"
	@echo "docker-up        - Start Docker containers"
	@echo "docker-down      - Stop Docker containers"
	@echo "docker-build     - Build Docker images"
	@echo "docker-logs      - View Docker logs"
	@echo "clean            - Remove Python artifacts"

install:
	pip install -r requirements/prod.txt

dev-install:
	pip install -r requirements/dev.txt
	pre-commit install

migrate:
	python manage.py migrate

makemigrations:
	python manage.py makemigrations

createsuperuser:
	python manage.py createsuperuser

shell:
	python manage.py shell

test:
	pytest

coverage:
	pytest --cov --cov-report=html --cov-report=term-missing
	@echo "Coverage report generated in htmlcov/index.html"

lint:
	black --check .
	isort --check-only .
	ruff check .
	mypy apps/

format:
	black .
	isort .
	ruff check --fix .

security:
	bandit -r apps/ -ll
	safety check --json || true
	python manage.py check --deploy

run:
	python manage.py runserver

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-build:
	docker-compose build

docker-logs:
	docker-compose logs -f

clean:
	find . -type f -name '*.pyc' -delete
	find . -type d -name '__pycache__' -delete
	find . -type d -name '*.egg-info' -exec rm -rf {} +
	rm -rf .pytest_cache .coverage htmlcov/ dist/ build/
