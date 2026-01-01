"""
Custom permission classes for AssessIQ.
"""
from rest_framework import permissions
from django.utils import timezone


class IsStudent(permissions.BasePermission):
    """
    Permission class to check if user is a student.
    """
    message = 'Only students can access this resource.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'student'
        )


class IsInstructor(permissions.BasePermission):
    """
    Permission class to check if user is an instructor.
    """
    message = 'Only instructors can access this resource.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'instructor'
        )


class IsInstructorOrReadOnly(permissions.BasePermission):
    """
    Permission class for instructor write access, read-only for others.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'instructor'
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners to edit.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for the owner
        # Check various owner fields
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'student'):
            return obj.student == request.user
        if hasattr(obj, 'instructor'):
            return obj.instructor == request.user

        return False


class IsOwner(permissions.BasePermission):
    """
    Object-level permission to only allow owners.
    """
    message = 'You do not have permission to access this resource.'

    def has_object_permission(self, request, view, obj):
        # Check various owner fields
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'student'):
            return obj.student == request.user
        if hasattr(obj, 'instructor'):
            return obj.instructor == request.user

        return False


class CanSubmitExam(permissions.BasePermission):
    """
    Permission to check if student can submit an exam.
    Validates exam availability, deadlines, and attempt limits.
    """
    message = 'You cannot submit this exam at this time.'

    def has_object_permission(self, request, view, obj):
        # Only for POST/PUT requests (submission)
        if request.method not in ['POST', 'PUT', 'PATCH']:
            return True

        # Must be a student
        if not request.user.is_student:
            self.message = 'Only students can submit exams.'
            return False

        # Get the exam (obj might be submission or exam)
        from apps.assessments.models import Exam
        exam = obj if isinstance(obj, Exam) else obj.exam

        # Check if exam is published
        if exam.status != 'published':
            self.message = 'This exam is not available for submission.'
            return False

        # Check if exam is within availability window
        now = timezone.now()
        if exam.start_time and now < exam.start_time:
            self.message = 'This exam has not started yet.'
            return False

        if exam.end_time and now > exam.end_time:
            self.message = 'This exam has ended.'
            return False

        # Check attempt limit
        from apps.submissions.models import Submission
        attempt_count = Submission.objects.filter(
            student=request.user,
            exam=exam
        ).count()

        if attempt_count >= exam.max_attempts:
            self.message = f'You have reached the maximum number of attempts ({exam.max_attempts}) for this exam.'
            return False

        return True


class CanViewSubmission(permissions.BasePermission):
    """
    Permission to check if user can view a submission.
    Students can only view their own submissions.
    Instructors can view all submissions for their courses.
    """
    message = 'You do not have permission to view this submission.'

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Student can view their own submission
        if user.is_student:
            return obj.student == user

        # Instructor can view submissions for their courses
        if user.is_instructor:
            return obj.exam.course.instructor == user

        # Admin can view all
        if user.is_admin or user.is_staff:
            return True

        return False


class CanGradeSubmission(permissions.BasePermission):
    """
    Permission to check if user can grade a submission.
    Only instructors of the course can grade.
    """
    message = 'You do not have permission to grade this submission.'

    def has_permission(self, request, view):
        return request.user.is_instructor or request.user.is_admin

    def has_object_permission(self, request, view, obj):
        user = request.user

        # Admin can grade all
        if user.is_admin or user.is_staff:
            return True

        # Instructor can grade submissions for their courses
        if user.is_instructor:
            return obj.exam.course.instructor == user

        return False


class IsVerifiedUser(permissions.BasePermission):
    """
    Permission to check if user has verified their email.
    """
    message = 'You must verify your email address to access this resource.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.is_verified
        )
