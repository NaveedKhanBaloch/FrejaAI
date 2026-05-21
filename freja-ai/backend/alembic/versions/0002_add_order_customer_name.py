"""add order customer name

Revision ID: 0002_add_order_customer_name
Revises: 0001_initial_schema
Create Date: 2026-05-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision = "0002_add_order_customer_name"
down_revision = "0001_initial_schema"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("customer_name", sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "customer_name")
