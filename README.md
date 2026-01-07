# AssessIQ

![Coverage](https://img.shields.io/badge/coverage-73%25-brightgreen)
![Tests](https://img.shields.io/badge/tests-108%20passed-success)
![Python](https://img.shields.io/badge/python-3.12-blue)
![Django](https://img.shields.io/badge/django-5.0-green)

A Django REST Framework-based mini assessment engine that enables secure exam submissions and automated grading. AssessIQ models real-world academic workflows, enforces student-level access control, and supports modular grading logic for scalable evaluation systems.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Grading Services](#grading-services)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Functionality

- **Multi-Role Authentication**: Support for students, instructors, and administrators
- **Course Management**: Create and organize courses with instructor assignment
- **Exam Creation**: Build exams with multiple question types
- **Secure Submissions**: Student-level access control for exam submissions
- **Automated Grading**: Multiple grading strategies (keyword matching, AI/LLM integration)
- **Review System**: Allow students to review their graded submissions
- **Attempt Tracking**: Support for multiple exam attempts with configurable limits

### Question Types

- **Multiple Choice**: Single-answer selection with predefined options
- **True/False**: Binary choice questions
- **Short Answer**: Brief text responses with keyword matching
- **Essay**: Long-form responses with AI-powered grading

### Grading Strategies

1. **Mock Grading Service**: Keyword matching and text similarity (TF-IDF, cosine similarity)
2. **OpenAI Integration**: GPT-4 and GPT-3.5-turbo powered grading
3. **Claude Integration**: Anthropic Claude models for assessment
4. **Gemini Integration**: Google's Gemini models for evaluation

All grading services are modular and easily swappable.

## Architecture

### Tech Stack

- **Backend**: Django 5.0, Django REST Framework 3.15
- **Database**: PostgreSQL (production), SQLite (development)
- **Caching**: Redis
- **Task Queue**: Celery for async grading
- **Authentication**: JWT (Simple JWT)
- **API Documentation**: drf-spectacular (OpenAPI/Swagger)
- **Testing**: pytest, pytest-django, coverage

### Database Schema

```
┌─────────────┐
│    User     │
├─────────────┤
│ email       │──┐
│ role        │  │
│ is_verified │  │
└─────────────┘  │
                 │
    ┌────────────┘
    │
    ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Course    │◄────┤     Exam     │◄────┤  Question   │
├─────────────┤      ├──────────────┤      ├─────────────┤
│ code        │      │ title        │      │ text        │
│ name        │      │ duration     │      │ type        │
│ instructor  │──┐   │ total_marks  │      │ marks       │
└─────────────┘  │   │ status       │      │ options     │
                 │   └──────────────┘      │ keywords    │
                 │          │               └─────────────┘
                 │          │                      │
                 │          ▼                      │
                 │   ┌──────────────┐             │
                 └──►│ Submission   │◄────────────┘
                     ├──────────────┤      │
                     │ student      │      │
                     │ status       │      ▼
                     │ total_score  │   ┌──────────────────┐
                     │ percentage   │   │ SubmissionAnswer │
                     └──────────────┘   ├──────────────────┤
                            │           │ answer_text      │
                            │           │ score            │
                            │           │ feedback         │
                            │           │ graded_by        │
                            └──────────►└──────────────────┘
```

### Key Design Patterns

- **Repository Pattern**: Custom managers for optimized queries
- **Strategy Pattern**: Pluggable grading services
- **Factory Pattern**: Grading service instantiation
- **Observer Pattern**: Async grading tasks with Celery

## Installation

### Prerequisites

- Python 3.12+
- PostgreSQL 14+ (for production)
- Redis 6+ (for caching and Celery)
- Virtual environment tool (venv, virtualenv, or conda)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/samuelogboye/AssessIQ
   cd AssessIQ
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv

   # Windows
   venv\Scripts\activate

   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the development server**
   ```bash
   python manage.py runserver
   ```

8. **Access the application**
   - API: http://localhost:8000/api/
   - Admin: http://localhost:8000/admin/
   - API Docs: http://localhost:8000/docs

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (Development - SQLite)
DATABASE_URL=sqlite:///db.sqlite3

# Database (Production - PostgreSQL)
# DATABASE_URL=postgresql://user:password@localhost:5432/assessiq

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=60  # minutes
JWT_REFRESH_TOKEN_LIFETIME=1440  # minutes (24 hours)

# Grading Services
GRADING_SERVICE=mock  # Options: mock, openai, claude, gemini

# OpenAI (optional)
OPENAI_API_KEY=your-openai-key

# Anthropic Claude (optional)
ANTHROPIC_API_KEY=your-anthropic-key

# Google Gemini (optional)
GOOGLE_API_KEY=your-google-key

# Email Settings (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-password

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Grading Service Configuration

Configure grading services in the Django admin or via API:

```python
# Example: OpenAI Configuration
{
    "api_key": "sk-...",
    "model": "gpt-4o-mini",
    "temperature": 0.3,
    "max_tokens": 500
}

# Example: Claude Configuration
{
    "api_key": "sk-ant-...",
    "model": "claude-3-5-sonnet-20241022",
    "temperature": 0.3,
    "max_tokens": 1000
}

# Example: Gemini Configuration
{
    "api_key": "AI...",
    "model_name": "gemini-1.5-flash",
    "temperature": 0.3,
    "max_tokens": 1000
}
```

## Usage

### Starting the Services

1. **Start Redis** (if not running)
   ```bash
   redis-server
   ```

2. **Start Celery Worker** (for async grading)
   ```bash
   celery -A config worker -l info
   ```

3. **Start Django Development Server**
   ```bash
   python manage.py runserver
   ```

### Common Commands

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run tests
python manage.py test

# Run tests with coverage
make coverage

# Run specific tests
python manage.py test apps.assessments.tests.test_assessment_api

# Collect static files (production)
python manage.py collectstatic

# Django shell
python manage.py shell
```

## API Documentation

### Authentication

The API uses JWT authentication. Obtain tokens via:

**POST** `/api/accounts/login/`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "student"
  }
}
```

Include the access token in subsequent requests:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Core Endpoints

#### Courses
- `GET /api/assessments/courses/` - List courses
- `POST /api/assessments/courses/` - Create course (instructor)
- `GET /api/assessments/courses/{id}/` - Course details
- `GET /api/assessments/courses/{id}/exams/` - List course exams

#### Exams
- `GET /api/assessments/exams/` - List exams (instructor)
- `POST /api/assessments/exams/` - Create exam with questions
- `GET /api/assessments/exams/{id}/` - Exam details
- `POST /api/assessments/exams/{id}/publish/` - Publish exam
- `GET /api/assessments/student-exams/` - Available exams (student)

#### Submissions
- `GET /api/submissions/` - List submissions
- `POST /api/submissions/` - Start exam submission
- `GET /api/submissions/{id}/` - Submission details
- `POST /api/submissions/{id}/save-answer/` - Save answer
- `POST /api/submissions/{id}/submit/` - Submit exam
- `GET /api/submissions/{id}/results/` - View results

#### Grading
- `POST /api/grading/submissions/{id}/grade/` - Grade submission
- `POST /api/grading/bulk-grade/` - Bulk grade submissions
- `GET /api/grading/configurations/` - List grading configs
- `POST /api/grading/configurations/` - Create grading config

### Example Workflows

#### 1. Instructor Creates an Exam

```bash
# 1. Login as instructor
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@example.com",
    "password": "password123"
  }'

# 2. Create exam with questions
curl -X POST http://localhost:8000/api/assessments/exams/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Midterm Exam",
    "course": 1,
    "duration_minutes": 60,
    "total_marks": 100,
    "passing_marks": 60,
    "questions": [
      {
        "question_type": "multiple_choice",
        "question_text": "What is Python?",
        "marks": 10,
        "options": ["Language", "Snake", "Framework"],
        "correct_answer": "Language"
      },
      {
        "question_type": "essay",
        "question_text": "Explain OOP concepts",
        "marks": 20,
        "use_ai_grading": true
      }
    ]
  }'

# 3. Publish exam
curl -X POST http://localhost:8000/api/assessments/exams/1/publish/ \
  -H "Authorization: Bearer <token>"
```

#### 2. Student Takes an Exam

```bash
# 1. Login as student
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'

# 2. List available exams
curl http://localhost:8000/api/assessments/student-exams/ \
  -H "Authorization: Bearer <token>"

# 3. Start submission
curl -X POST http://localhost:8000/api/submissions/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "exam": 1
  }'

# 4. Save answers
curl -X POST http://localhost:8000/api/submissions/1/save-answer/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "question_id": 1,
    "answer_text": "Language"
  }'

# 5. Submit exam
curl -X POST http://localhost:8000/api/submissions/1/submit/ \
  -H "Authorization: Bearer <token>"

# 6. View results
curl http://localhost:8000/api/submissions/1/results/ \
  -H "Authorization: Bearer <token>"
```

## Grading Services

### Mock Grading Service

The default service for development and testing. Uses:
- **Exact matching**: Perfect score for exact matches
- **Keyword matching**: Scores based on keyword presence
- **Text similarity**: Word overlap similarity for general text

No API key required.

### OpenAI Service

Powered by GPT models. Features:
- Contextual understanding
- Detailed feedback generation
- Configurable temperature and token limits
- JSON response parsing

**Setup:**
```bash
pip install openai
export OPENAI_API_KEY=sk-...
```

### Claude Service

Anthropic's Claude models. Features:
- Advanced reasoning capabilities
- Markdown JSON response handling
- Detailed rubric-based grading
- High-quality feedback

**Setup:**
```bash
pip install anthropic
export ANTHROPIC_API_KEY=sk-ant-...
```

### Gemini Service

Google's Gemini models. Features:
- Multimodal capabilities (future)
- Fast processing
- Cost-effective
- JSON mode support

**Setup:**
```bash
pip install google-generativeai
export GOOGLE_API_KEY=AI...
```

### Creating Custom Grading Services

Extend `BaseGradingService`:

```python
from apps.grading.services.base import BaseGradingService
from typing import Any

class CustomGradingService(BaseGradingService):
    def __init__(self, config: dict[str, Any] = None):
        self.config = config or {}
        # Initialize your service

    def grade(self, submission_answer) -> dict[str, Any]:
        """
        Grade a submission answer.

        Returns:
            dict with keys: score, feedback, confidence
        """
        # Your grading logic here
        return {
            "score": 8.5,
            "feedback": "Good answer!",
            "confidence": 90.0,
            "method": "custom"
        }

    def validate_config(self, config: dict[str, Any]) -> bool:
        # Validate configuration
        return True

# Register the service
from apps.grading.services.base import BaseGradingService
BaseGradingService.register("custom", CustomGradingService)
```

## Testing

### Running Tests

```bash
# Run all tests
python manage.py test

# Run with coverage
make coverage

# Run specific app tests
python manage.py test apps.assessments

# Run specific test class
python manage.py test apps.assessments.tests.test_assessment_api.TestExamAPI

# Run specific test method
python manage.py test apps.assessments.tests.test_assessment_api.TestExamAPI.test_create_exam

# Run tests in parallel
python manage.py test --parallel
```

### Test Coverage

Current coverage: **73.33%**

```
Module                                Coverage
----------------------------------------
apps.accounts                          80.00%
apps.assessments                       86.15%
apps.grading                           77.78%
apps.grading.services.mock             65.15%
apps.grading.services.openai           67.37%
apps.grading.services.claude           61.11%
apps.grading.services.gemini           57.52%
apps.submissions                       90.97%
----------------------------------------
TOTAL                                  73.33%
```

### Writing Tests

```python
import pytest
from rest_framework.test import APIClient
from apps.accounts.models import User

@pytest.mark.django_db
class TestExamAPI:
    def test_create_exam(self, api_client, instructor, course):
        """Test instructor can create exam."""
        api_client.force_authenticate(user=instructor)

        data = {
            "title": "Test Exam",
            "course": course.id,
            "duration_minutes": 60,
            "total_marks": 100
        }

        response = api_client.post("/api/assessments/exams/", data)
        assert response.status_code == 201
```

## Deployment

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# View logs
docker-compose logs -f web
```

### Production Checklist

- [ ] Set `DEBUG=False`
- [ ] Configure strong `SECRET_KEY`
- [ ] Set up PostgreSQL database
- [ ] Configure Redis for caching
- [ ] Set up Celery workers
- [ ] Configure email backend
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up static files serving (Nginx/CloudFront)
- [ ] Configure monitoring (Sentry)
- [ ] Set up backups
- [ ] Configure rate limiting
- [ ] Review security settings

## Project Structure

```
AssessIQ/
├── apps/
│   ├── accounts/          # User management, authentication
│   ├── assessments/       # Courses, exams, questions
│   ├── core/              # Shared utilities, permissions
│   ├── grading/           # Grading services and tasks
│   └── submissions/       # Exam submissions and answers
├── config/
│   ├── settings/          # Django settings (base, dev, prod)
│   ├── urls.py            # Root URL configuration
│   └── wsgi.py            # WSGI application
├── docs/                  # Additional documentation
├── staticfiles/           # Collected static files
├── media/                 # User-uploaded files
├── requirements.txt       # Python dependencies
├── manage.py              # Django management script
├── pytest.ini             # Pytest configuration
├── Makefile              # Common commands
├── Dockerfile            # Docker configuration
└── docker-compose.yml    # Docker services
```

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow PEP 8 style guide
   - Write tests for new features
   - Update documentation

4. **Run tests and linting**
   ```bash
   make coverage
   flake8 .
   black .
   isort .
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

6. **Push and create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- Use [Black](https://github.com/psf/black) for formatting
- Use [isort](https://pycqa.github.io/isort/) for import sorting
- Write docstrings for all functions and classes
- Keep functions focused and small

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new grading service
fix: correct submission validation
docs: update API documentation
test: add tests for exam creation
refactor: improve query optimization
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [Link to full docs]
- **Issues**: [GitHub Issues](https://github.com/samuelogboye/assessiq/issues)
- **Email**: ogboyesam@gmail.com

## Acknowledgments

- Django REST Framework team
- OpenAI, Anthropic, and Google for AI/ML APIs
- All contributors to this project

---

**Built with ❤️ using Django and Django REST Framework**
