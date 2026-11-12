from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_role
from app.repositories.repository import StudentRepository
from app.schemas.schemas import StudentOut, StudentUpdate

router = APIRouter(prefix="/students", tags=["students"])


@router.get("", response_model=list[StudentOut])
async def list_students(
    db: AsyncSession = Depends(get_db), _=Depends(require_role("COORDINATOR"))
):
    return await StudentRepository.list_all(db)


@router.get("/me", response_model=StudentOut)
async def my_profile(db: AsyncSession = Depends(get_db), payload: dict = Depends(require_role("STUDENT"))):
    student = await StudentRepository.get(db, payload["linked_id"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return student


@router.patch("/me", response_model=StudentOut)
async def update_my_profile(
    body: StudentUpdate, db: AsyncSession = Depends(get_db), payload: dict = Depends(require_role("STUDENT"))
):
    student = await StudentRepository.get(db, payload["linked_id"])
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if body.resume_url is not None:
        student.resume_url = body.resume_url
    return await StudentRepository.save(db, student)
