"""add_tds_deducted_to_payouts

Revision ID: 2a2d82951001
Revises: d2e4f6a8b0c1
Create Date: 2026-07-07 23:14:37.669298

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2a2d82951001'
down_revision: Union[str, Sequence[str], None] = 'd2e4f6a8b0c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('payouts', sa.Column('tds_deducted', sa.DECIMAL(precision=10, scale=2), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('payouts', 'tds_deducted')
