"""
Custom permission classes for AssessIQ.
"""
from rest_framework import permissions


class IsStudent(permissions.BasePermission):
    """
    Permission class to check if user is a student.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'student'


class IsInstructor(permissions.BasePermission):
    """
    Permission class to check if user is an instructor.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'instructor'


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow owners to edit.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for the owner
        return obj.user == request.user or obj.student == request.user
