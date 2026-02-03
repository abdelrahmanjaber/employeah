from __future__ import annotations

import sqlalchemy as sa
from alembic import context, op


revision = "20260203_01"
down_revision = "20260202_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if context.is_offline_mode():
        op.add_column("data_source", sa.Column("canonical_link", sa.Text(), nullable=True))
        return

    conn = op.get_bind()

    op.add_column("data_source", sa.Column("canonical_link", sa.Text(), nullable=True))

    conn.execute(
        sa.text(
            """
            UPDATE data_source
            SET canonical_link = CASE
              WHEN link IS NULL THEN NULL
              WHEN lower(name) = 'hackernews' THEN link
              ELSE split_part(link, '?', 1)
            END
            """
        )
    )

    op.create_index("ix_data_source_canonical_link", "data_source", ["canonical_link"], unique=False)
    op.create_index("ix_data_source_name_canonical_link", "data_source", ["name", "canonical_link"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_data_source_name_canonical_link", table_name="data_source")
    op.drop_index("ix_data_source_canonical_link", table_name="data_source")
    op.drop_column("data_source", "canonical_link")

