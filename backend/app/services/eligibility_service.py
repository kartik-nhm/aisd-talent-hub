from decimal import Decimal, ROUND_HALF_UP
from app.models.models import JobListing, Student


class EligibilityService:
    @staticmethod
    def verify_eligibility(student: Student, job: JobListing) -> tuple[bool, str]:
        """
        Core business logic rule checking (TalentHub Spec: Rules R1-R4)
        """
        # Rule R3: Season-Wide One-Company Placement Policy (Lockout)
        if getattr(student, "has_accepted_offer", False):
            return False, "Ineligible: Candidate has already accepted an offer this season (One-Company Policy)"

        # Rule R1: CGPA Comparison with 2-decimal quantization
        student_cgpa = Decimal(str(student.cgpa)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        min_cgpa = Decimal(str(job.min_cgpa)).quantize(Decimal("0.01"))
        if student_cgpa < min_cgpa:
            return False, f"CGPA ({student.cgpa}) is below required minimum ({job.min_cgpa})"

        # Rule R2: Active Backlogs ceiling
        if student.active_backlogs > job.max_backlogs:
            return False, f"Active backlogs ({student.active_backlogs}) exceed maximum allowed ({job.max_backlogs})"

        # Rule R4: Allowed Branches Whitelist
        if job.allowed_branches and job.allowed_branches.strip() not in ("ALL", ""):
            allowed = [b.strip().lower() for b in job.allowed_branches.split(",") if b.strip()]
            if student.branch.strip().lower() not in allowed:
                return False, f"Branch '{student.branch}' is not eligible (Allowed: {job.allowed_branches})"

        # Check job active status
        if hasattr(job, "is_active") and not job.is_active:
            return False, "This recruitment drive has been closed"

        return True, "Eligible to apply"
