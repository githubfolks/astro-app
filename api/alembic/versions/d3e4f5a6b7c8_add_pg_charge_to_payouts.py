"""add_pg_charge_to_payouts

Revision ID: d3e4f5a6b7c8
Revises: ac5aab4b5544
Create Date: 2026-07-14 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd3e4f5a6b7c8'
down_revision: Union[str, Sequence[str], None] = 'ac5aab4b5544'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'payouts',
        sa.Column('pg_charge_deducted', sa.DECIMAL(10, 2), nullable=True, server_default='0.0'),
    )


def downgrade() -> None:
    op.drop_column('payouts', 'pg_charge_deducted')
