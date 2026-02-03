from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260108_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    def has_table(name: str) -> bool:
        return insp.has_table(name)

    def has_column(table: str, col: str) -> bool:
        if not insp.has_table(table):
            return False
        return col in {c["name"] for c in insp.get_columns(table)}

    if not has_table("job"):
        op.create_table(
            "company",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=255), nullable=False),
        )
        op.create_index("ix_company_name", "company", ["name"], unique=True)

        op.create_table(
            "field",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=255), nullable=False),
        )
        op.create_index("ix_field_name", "field", ["name"], unique=True)

        op.create_table(
            "skill",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
        )
        op.create_index("ix_skill_name", "skill", ["name"], unique=True)

        op.create_table(
            "location",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("continent", sa.String(length=100), nullable=True),
            sa.Column("country", sa.String(length=100), nullable=True),
            sa.Column("city", sa.String(length=100), nullable=True),
            sa.UniqueConstraint("continent", "country", "city", name="uq_location"),
        )

        op.create_table(
            "job",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("title", sa.String(length=500), nullable=False),
            sa.Column("date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("salary", sa.Integer(), nullable=True),
            sa.Column("company_id", sa.Integer(), sa.ForeignKey("company.id"), nullable=True),
        )
        op.create_index("ix_job_title", "job", ["title"], unique=False)
        op.create_index("ix_job_company_id", "job", ["company_id"], unique=False)

        op.create_table(
            "data_source",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("link", sa.Text(), nullable=True),
            sa.Column("job_id", sa.Integer(), sa.ForeignKey("job.id"), nullable=False),
        )
        op.create_index("ix_data_source_name", "data_source", ["name"], unique=False)
        op.create_index("ix_data_source_job_id", "data_source", ["job_id"], unique=False)

        op.create_table(
            "university",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=255), nullable=False),
        )
        op.create_index("ix_university_name", "university", ["name"], unique=True)

        op.create_table(
            "course",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("title", sa.String(length=500), nullable=False),
            sa.Column("semester", sa.String(length=50), nullable=True),
            sa.Column("url", sa.Text(), nullable=True),
        )
        op.create_index("ix_course_title", "course", ["title"], unique=True)

        op.create_table(
            "job_field",
            sa.Column("field_id", sa.Integer(), sa.ForeignKey("field.id"), primary_key=True),
            sa.Column("job_id", sa.Integer(), sa.ForeignKey("job.id"), primary_key=True),
        )
        op.create_table(
            "job_skills",
            sa.Column("job_id", sa.Integer(), sa.ForeignKey("job.id"), primary_key=True),
            sa.Column("skill_id", sa.Integer(), sa.ForeignKey("skill.id"), primary_key=True),
        )
        op.create_table(
            "job_location",
            sa.Column("job_id", sa.Integer(), sa.ForeignKey("job.id"), primary_key=True),
            sa.Column("location_id", sa.Integer(), sa.ForeignKey("location.id"), primary_key=True),
        )
        op.create_table(
            "course_skills",
            sa.Column("skill_id", sa.Integer(), sa.ForeignKey("skill.id"), primary_key=True),
            sa.Column("course_id", sa.Integer(), sa.ForeignKey("course.id"), primary_key=True),
        )
        op.create_table(
            "university_course",
            sa.Column("university_id", sa.Integer(), sa.ForeignKey("university.id"), primary_key=True),
            sa.Column("course_id", sa.Integer(), sa.ForeignKey("course.id"), primary_key=True),
        )
        return

    # Existing DB: add missing columns only
    if not has_column("job", "salary"):
        op.add_column("job", sa.Column("salary", sa.Integer(), nullable=True))
    if not has_column("course", "semester"):
        op.add_column("course", sa.Column("semester", sa.String(length=50), nullable=True))
    if not has_column("course", "url"):
        op.add_column("course", sa.Column("url", sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    def has_column(table: str, col: str) -> bool:
        if not insp.has_table(table):
            return False
        return col in {c["name"] for c in insp.get_columns(table)}

    if has_column("course", "url"):
        op.drop_column("course", "url")
    if has_column("course", "semester"):
        op.drop_column("course", "semester")
    if has_column("job", "salary"):
        op.drop_column("job", "salary")


