"""add_internal_test_payment_status

Revision ID: eb134663ee2a
Revises: e7f8a9b0c1d2
Create Date: 2026-08-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eb134663ee2a'
down_revision: Union[str, Sequence[str], None] = 'e7f8a9b0c1d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE paymentstatus ADD VALUE IF NOT EXISTS 'INTERNAL_TEST'")


def downgrade() -> None:
    # Postgres does not support dropping a value from an enum type.
    pass
