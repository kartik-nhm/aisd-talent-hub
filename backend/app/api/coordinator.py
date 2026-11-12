from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.repositories.repository import ApplicationRepository, CompanyRepository, JobRepository, StudentRepository
from app.schemas.schemas import ApplicationOut, CoordinatorStats, StudentOut
from app.services.serializers import serialize_application

router = APIRouter(prefix="/coordinator", tags=["coordinator"])


@router.get("/stats", response_model=CoordinatorStats)
async def stats(db: AsyncSession = Depends(get_db), _=Depends(require_role("COORDINATOR"))):
    students = await StudentRepository.list_all(db)
    companies = await CompanyRepository.list_all(db)
    jobs = await JobRepository.list_all(db)
    applications = await ApplicationRepository.list_all(db)

    total_offers = sum(1 for a in applications if a.offer is not None)
    total_accepted = sum(1 for a in applications if a.status == "ACCEPTED")
    placed_student_ids = {s.id for s in students if s.has_accepted_offer}
    placement_percentage = (len(placed_student_ids) / len(students) * 100) if students else 0.0

    return CoordinatorStats(
        total_students=len(students),
        total_companies=len(companies),
        total_jobs=len(jobs),
        total_applications=len(applications),
        total_offers=total_offers,
        total_accepted=total_accepted,
        total_placed=len(placed_student_ids),
        placement_percentage=round(placement_percentage, 1),
    )


@router.get("/applications", response_model=list[ApplicationOut])
async def all_applications(db: AsyncSession = Depends(get_db), _=Depends(require_role("COORDINATOR"))):
    applications = await ApplicationRepository.list_all(db)
    return [serialize_application(a) for a in applications]


@router.get("/students", response_model=list[StudentOut])
async def all_students(db: AsyncSession = Depends(get_db), _=Depends(require_role("COORDINATOR"))):
    return await StudentRepository.list_all(db)


@router.patch("/students/{student_id}/reset-placement", response_model=StudentOut)
async def reset_student_placement(
    student_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_role("COORDINATOR"))
):
    student = await StudentRepository.get(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.has_accepted_offer = False
    return await StudentRepository.save(db, student)
