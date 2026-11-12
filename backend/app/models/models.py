import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # STUDENT, COMPANY, COORDINATOR
    student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    usn = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    branch = Column(String, nullable=False)
    cgpa = Column(Float, nullable=False)
    active_backlogs = Column(Integer, default=0, nullable=False)
    has_accepted_offer = Column(Boolean, default=False, nullable=False)
    resume_url = Column(String, default="")

    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")


class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, default="")

    jobs = relationship("JobListing", back_populates="company", cascade="all, delete-orphan")


class JobListing(Base):
    __tablename__ = "job_listings"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    role_title = Column(String, nullable=False)
    description = Column(String, default="")
    package_lpa = Column(Float, default=0.0)
    min_cgpa = Column(Float, default=0.0)
    max_backlogs = Column(Integer, default=0)
    allowed_branches = Column(String, default="ALL")  # Comma-separated or 'ALL'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("student_id", "job_id", name="uq_student_job"),)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("job_listings.id", ondelete="CASCADE"), nullable=False)
    # APPLIED, SHORTLISTED, REJECTED, INTERVIEW_SCHEDULED, OFFERED, ACCEPTED, DECLINED, WITHDRAWN
    status = Column(String, default="APPLIED")
    applied_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="applications")
    job = relationship("JobListing", back_populates="applications")
    interview = relationship("Interview", back_populates="application", uselist=False, cascade="all, delete-orphan")
    offer = relationship("Offer", back_populates="application", uselist=False, cascade="all, delete-orphan")


class Interview(Base):
    __tablename__ = "interviews"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), unique=True, nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    result = Column(String, default="PENDING")  # PENDING, PASS, FAIL
    notes = Column(String, default="")

    application = relationship("Application", back_populates="interview")


class Offer(Base):
    __tablename__ = "offers"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), unique=True, nullable=False)
    package_lpa = Column(Float, default=0.0)
    status = Column(String, default="ISSUED")  # ISSUED, ACCEPTED, DECLINED
    secure_token = Column(String, unique=True, default=lambda: f"sec_offer_{uuid.uuid4().hex[:16]}")
    issued_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="offer")
