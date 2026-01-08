from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Company(Base):
    __tablename__ = "company"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    jobs: Mapped[list["Job"]] = relationship(back_populates="company")


class Field(Base):
    __tablename__ = "field"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    jobs: Mapped[list["Job"]] = relationship(
        secondary="job_field",
        back_populates="fields",
    )


class Skill(Base):
    __tablename__ = "skill"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    jobs: Mapped[list["Job"]] = relationship(
        secondary="job_skills",
        back_populates="skills",
    )
    courses: Mapped[list["Course"]] = relationship(
        secondary="course_skills",
        back_populates="skills",
    )


class Location(Base):
    __tablename__ = "location"
    __table_args__ = (UniqueConstraint("continent", "country", "city", name="uq_location"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    continent: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)

    jobs: Mapped[list["Job"]] = relationship(
        secondary="job_location",
        back_populates="locations",
    )


class Job(Base):
    __tablename__ = "job"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(500), index=True)
    date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    salary: Mapped[int | None] = mapped_column(Integer, nullable=True)

    company_id: Mapped[int | None] = mapped_column(ForeignKey("company.id"), nullable=True, index=True)
    company: Mapped[Company | None] = relationship(back_populates="jobs")

    fields: Mapped[list[Field]] = relationship(
        secondary="job_field",
        back_populates="jobs",
    )
    skills: Mapped[list[Skill]] = relationship(
        secondary="job_skills",
        back_populates="jobs",
    )
    locations: Mapped[list[Location]] = relationship(
        secondary="job_location",
        back_populates="jobs",
    )
    data_sources: Mapped[list["DataSource"]] = relationship(back_populates="job")


class DataSource(Base):
    __tablename__ = "data_source"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    link: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job.id"), index=True)

    job: Mapped[Job] = relationship(back_populates="data_sources")


class University(Base):
    __tablename__ = "university"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    courses: Mapped[list["Course"]] = relationship(
        secondary="university_course",
        back_populates="universities",
    )


class Course(Base):
    __tablename__ = "course"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(500), unique=True, index=True)
    semester: Mapped[str | None] = mapped_column(String(50), nullable=True)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)

    universities: Mapped[list[University]] = relationship(
        secondary="university_course",
        back_populates="courses",
    )
    skills: Mapped[list[Skill]] = relationship(
        secondary="course_skills",
        back_populates="courses",
    )


class JobField(Base):
    __tablename__ = "job_field"

    field_id: Mapped[int] = mapped_column(ForeignKey("field.id"), primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job.id"), primary_key=True)


class JobSkills(Base):
    __tablename__ = "job_skills"

    job_id: Mapped[int] = mapped_column(ForeignKey("job.id"), primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skill.id"), primary_key=True)


class JobLocation(Base):
    __tablename__ = "job_location"

    job_id: Mapped[int] = mapped_column(ForeignKey("job.id"), primary_key=True)
    location_id: Mapped[int] = mapped_column(ForeignKey("location.id"), primary_key=True)


class CourseSkills(Base):
    __tablename__ = "course_skills"

    skill_id: Mapped[int] = mapped_column(ForeignKey("skill.id"), primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("course.id"), primary_key=True)


class UniversityCourse(Base):
    __tablename__ = "university_course"

    university_id: Mapped[int] = mapped_column(ForeignKey("university.id"), primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("course.id"), primary_key=True)
