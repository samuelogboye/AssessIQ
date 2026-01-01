#!/usr/bin/env python
"""
Script to verify that all models are working correctly.
Run with: python manage.py shell < scripts/verify_models.py
"""
import os
import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.auth import get_user_model
from apps.assessments.models import Course, Exam, Question
from apps.submissions.models import Submission, SubmissionAnswer
from apps.grading.models import GradingTask, GradingConfiguration

User = get_user_model()

print("=" * 50)
print("AssessIQ Model Verification")
print("=" * 50)

# Check User model
print("\n1. Checking User model...")
user_count = User.objects.count()
print(f"   ✓ User model working ({user_count} users)")

# Check Course model
print("\n2. Checking Course model...")
course_count = Course.objects.count()
print(f"   ✓ Course model working ({course_count} courses)")

# Check Exam model
print("\n3. Checking Exam model...")
exam_count = Exam.objects.count()
print(f"   ✓ Exam model working ({exam_count} exams)")

# Check Question model
print("\n4. Checking Question model...")
question_count = Question.objects.count()
print(f"   ✓ Question model working ({question_count} questions)")

# Check Submission model
print("\n5. Checking Submission model...")
submission_count = Submission.objects.count()
print(f"   ✓ Submission model working ({submission_count} submissions)")

# Check SubmissionAnswer model
print("\n6. Checking SubmissionAnswer model...")
answer_count = SubmissionAnswer.objects.count()
print(f"   ✓ SubmissionAnswer model working ({answer_count} answers)")

# Check GradingTask model
print("\n7. Checking GradingTask model...")
task_count = GradingTask.objects.count()
print(f"   ✓ GradingTask model working ({task_count} tasks)")

# Check GradingConfiguration model
print("\n8. Checking GradingConfiguration model...")
config_count = GradingConfiguration.objects.count()
print(f"   ✓ GradingConfiguration model working ({config_count} configs)")

print("\n" + "=" * 50)
print("All models verified successfully!")
print("=" * 50)
