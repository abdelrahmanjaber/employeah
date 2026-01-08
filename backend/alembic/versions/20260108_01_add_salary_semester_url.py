from alembic import op
import sqlalchemy as sa


revision = "20260108_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("job", sa.Column("salary", sa.Integer(), nullable=True))
    op.add_column("course", sa.Column("semester", sa.String(length=50), nullable=True))
    op.add_column("course", sa.Column("url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("course", "url")
    op.drop_column("course", "semester")
    op.drop_column("job", "salary")


