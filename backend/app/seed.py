from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.models import Company, JobListing, Student, User

DEMO_PASSWORD = "password123"


async def seed_if_empty(db: AsyncSession):
    result = await db.execute(select(User))
    if result.scalars().first():
        return  # already seeded

    # Companies
    abc = Company(name="ABC Technologies", description="Product-based software company")
    xyz = Company(name="XYZ Corp", description="Core engineering & infrastructure company")
    db.add_all([abc, xyz])
    await db.flush()

    # Jobs with Rule R4 Allowed Branches Whitelists
    jobs = [
        JobListing(
            company_id=abc.id,
            role_title="Software Developer",
            description="Full-stack development role working on cloud products.",
            package_lpa=8.5,
            min_cgpa=7.0,
            max_backlogs=2,
            allowed_branches="Computer Science, Information Technology",
            is_active=True,
        ),
        JobListing(
            company_id=abc.id,
            role_title="QA Engineer",
            description="Manual and automated testing of web applications.",
            package_lpa=6.0,
            min_cgpa=6.0,
            max_backlogs=3,
            allowed_branches="ALL",
            is_active=True,
        ),
        JobListing(
            company_id=xyz.id,
            role_title="Backend Engineer",
            description="Build and maintain scalable backend services.",
            package_lpa=10.0,
            min_cgpa=8.0,
            max_backlogs=0,
            allowed_branches="Computer Science, Information Technology",
            is_active=True,
        ),
    ]
    db.add_all(jobs)
    await db.flush()

    # Students with USNs and Resumes
    students = [
        Student(
            usn="1RV21CS001",
            name="Rahul Sharma",
            email="rahul@student.talenthub.edu",
            branch="Computer Science",
            cgpa=8.2,
            active_backlogs=1,
            has_accepted_offer=False,
            resume_url="https://talenthub.edu/resumes/rahul_sharma.pdf",
        ),
        Student(
            usn="1RV21IS045",
            name="Priya Nair",
            email="priya@student.talenthub.edu",
            branch="Information Technology",
            cgpa=9.1,
            active_backlogs=0,
            has_accepted_offer=False,
            resume_url="https://talenthub.edu/resumes/priya_nair.pdf",
        ),
        Student(
            usn="1RV21EC089",
            name="Aman Verma",
            email="aman@student.talenthub.edu",
            branch="Electronics",
            cgpa=6.4,
            active_backlogs=3,
            has_accepted_offer=False,
            resume_url="https://talenthub.edu/resumes/aman_verma.pdf",
        ),
    ]
    db.add_all(students)
    await db.flush()

    # Users (auth) - one per student, one per company, one coordinator
    users = [
        User(
            email="rahul@student.talenthub.edu",
            hashed_password=hash_password(DEMO_PASSWORD),
            role="STUDENT",
            student_id=students[0].id,
        ),
        User(
            email="priya@student.talenthub.edu",
            hashed_password=hash_password(DEMO_PASSWORD),
            role="STUDENT",
            student_id=students[1].id,
        ),
        User(
            email="aman@student.talenthub.edu",
            hashed_password=hash_password(DEMO_PASSWORD),
            role="STUDENT",
            student_id=students[2].id,
        ),
        User(
            email="hr@abctech.com",
            hashed_password=hash_password(DEMO_PASSWORD),
            role="COMPANY",
            company_id=abc.id,
        ),
        User(
            email="hr@xyzcorp.com",
            hashed_password=hash_password(DEMO_PASSWORD),
            role="COMPANY",
            company_id=xyz.id,
        ),
        User(
            email="coordinator@talenthub.edu",
            hashed_password=hash_password(DEMO_PASSWORD),
            role="COORDINATOR",
        ),
    ]
    db.add_all(users)
    await db.commit()
