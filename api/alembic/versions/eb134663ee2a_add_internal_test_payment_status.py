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
    # report_leads/paymentstatus aren't created by a migration — they're
    # created by Base.metadata.create_all() at app startup, which runs after
    # `alembic upgrade head` (see api/Dockerfile's CMD). On a DB that hasn't
    # booted the app yet, the type doesn't exist; create_all() will create it
    # fresh with INTERNAL_TEST already included as a PaymentStatus member, so
    # this migration only needs to act when the type already exists.
    conn = op.get_bind()
    type_exists = conn.execute(
        sa.text("SELECT 1 FROM pg_type WHERE typname = 'paymentstatus'")
    ).scalar()
    if type_exists:
        with op.get_context().autocommit_block():
            op.execute("ALTER TYPE paymentstatus ADD VALUE IF NOT EXISTS 'INTERNAL_TEST'")


def downgrade() -> None:
    # Postgres does not support dropping a value from an enum type.
    pass
