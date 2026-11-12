from app.models.models import Application, JobListing
from app.services.eligibility_service import EligibilityService


def serialize_job(job: JobListing, student=None) -> dict:
    data = {
        "id": job.id,
        "company_id": job.company_id,
        "role_title": job.role_title,
        "description": job.description,
        "package_lpa": job.package_lpa,
        "min_cgpa": job.min_cgpa,
        "max_backlogs": job.max_backlogs,
        "allowed_branches": getattr(job, "allowed_branches", "ALL"),
        "is_active": getattr(job, "is_active", True),
        "company_name": job.company.name if job.company else None,
    }
    if student is not None:
        eligible, reason = EligibilityService.verify_eligibility(student, job)
        data["eligible"] = eligible
        data["reason"] = reason
    return data


def serialize_application(application: Application) -> dict:
    interview = application.interview
    offer = application.offer
    student = application.student
    job = application.job
    return {
        "id": application.id,
        "student_id": application.student_id,
        "job_id": application.job_id,
        "status": application.status,
        "applied_at": application.applied_at,
        "student_name": student.name if student else None,
        "student_usn": getattr(student, "usn", None) if student else None,
        "student_branch": getattr(student, "branch", None) if student else None,
        "student_cgpa": student.cgpa if student else None,
        "student_backlogs": student.active_backlogs if student else None,
        "student_resume_url": getattr(student, "resume_url", "") if student else "",
        "has_accepted_offer": getattr(student, "has_accepted_offer", False) if student else False,
        "job_title": job.role_title if job else None,
        "company_name": job.company.name if job and job.company else None,
        "allowed_branches": getattr(job, "allowed_branches", "ALL") if job else "ALL",
        "interview": (
            {
                "id": interview.id,
                "scheduled_at": interview.scheduled_at,
                "result": interview.result,
                "notes": interview.notes,
            }
            if interview
            else None
        ),
        "offer": (
            {
                "id": offer.id,
                "package_lpa": offer.package_lpa,
                "status": offer.status,
                "secure_token": getattr(offer, "secure_token", None),
                "issued_at": offer.issued_at,
            }
            if offer
            else None
        ),
    }
