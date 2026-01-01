"""
Celery tasks for automated grading.
"""

from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def grade_submission(self, submission_id):
    """
    Grade an entire submission asynchronously.

    Args:
        submission_id: ID of the submission to grade

    Returns:
        dict: Grading results
    """
    from apps.submissions.models import Submission
    from .models import GradingTask

    try:
        submission = (
            Submission.objects.select_related("exam")
            .prefetch_related("answers", "answers__question")
            .get(id=submission_id)
        )

        # Create grading task
        task = GradingTask.objects.create(
            submission=submission,
            grading_method="mock",  # Will be determined by configuration
            celery_task_id=self.request.id,
            status="in_progress",
            started_at=timezone.now(),
        )

        try:
            # Grade each answer
            for answer in submission.answers.all():
                grade_answer.delay(answer.id)

            # Calculate total score
            submission.calculate_score()
            submission.mark_as_graded()

            # Mark task as completed
            task.mark_completed(
                {
                    "total_score": float(submission.total_score),
                    "percentage": float(submission.percentage),
                    "graded_answers": submission.answers.count(),
                }
            )

            logger.info(f"Successfully graded submission {submission_id}")
            return {"status": "success", "submission_id": submission_id}

        except Exception as e:
            task.mark_failed(str(e))
            raise

    except Submission.DoesNotExist:
        logger.error(f"Submission {submission_id} not found")
        raise

    except Exception as exc:
        logger.error(f"Error grading submission {submission_id}: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def grade_answer(self, answer_id):
    """
    Grade a single answer asynchronously.

    Args:
        answer_id: ID of the SubmissionAnswer to grade

    Returns:
        dict: Grading result for this answer
    """
    from apps.submissions.models import SubmissionAnswer
    from .services import GradingService

    try:
        answer = SubmissionAnswer.objects.select_related("question", "submission").get(id=answer_id)

        # Try auto-grading first
        if answer.auto_grade():
            logger.info(f"Auto-graded answer {answer_id}")
            return {
                "status": "success",
                "answer_id": answer_id,
                "score": float(answer.score) if answer.score else 0,
                "method": "auto",
            }

        # If auto-grading not applicable, use grading service
        grading_service = GradingService.get_service(answer.question)
        result = grading_service.grade(answer)

        logger.info(f"AI-graded answer {answer_id}")
        return {
            "status": "success",
            "answer_id": answer_id,
            "score": float(answer.score) if answer.score else 0,
            "method": "ai",
        }

    except SubmissionAnswer.DoesNotExist:
        logger.error(f"SubmissionAnswer {answer_id} not found")
        raise

    except Exception as exc:
        logger.error(f"Error grading answer {answer_id}: {str(exc)}")
        raise self.retry(exc=exc, countdown=30)


@shared_task
def bulk_grade_submissions(submission_ids):
    """
    Grade multiple submissions in bulk.

    Args:
        submission_ids: List of submission IDs to grade

    Returns:
        dict: Summary of grading results
    """
    results = {"total": len(submission_ids), "success": 0, "failed": 0, "errors": []}

    for submission_id in submission_ids:
        try:
            grade_submission.delay(submission_id)
            results["success"] += 1
        except Exception as e:
            results["failed"] += 1
            results["errors"].append({"submission_id": submission_id, "error": str(e)})
            logger.error(f"Failed to queue grading for submission {submission_id}: {e}")

    return results


@shared_task
def regrade_submission(submission_id, regrade_all=False):
    """
    Regrade a submission.

    Args:
        submission_id: ID of the submission to regrade
        regrade_all: If True, regrade all answers. If False, only regrade flagged answers.

    Returns:
        dict: Regrading results
    """
    from apps.submissions.models import Submission

    try:
        submission = Submission.objects.get(id=submission_id)

        if regrade_all:
            answers = submission.answers.all()
        else:
            answers = submission.answers.filter(requires_manual_review=True)

        for answer in answers:
            # Reset score and regrade
            answer.score = None
            answer.graded_by = ""
            answer.save()
            grade_answer.delay(answer.id)

        logger.info(f"Triggered regrade for submission {submission_id}, {answers.count()} answers")
        return {
            "status": "success",
            "submission_id": submission_id,
            "answers_regraded": answers.count(),
        }

    except Submission.DoesNotExist:
        logger.error(f"Submission {submission_id} not found")
        return {"status": "error", "message": "Submission not found"}
