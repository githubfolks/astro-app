"""add_is_premium_to_astrologer_profiles

Revision ID: d2e4f6a8b0c1
Revises: c9d1f4a6b2e8
Create Date: 2026-07-07 00:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd2e4f6a8b0c1'
down_revision: Union[str, Sequence[str], None] = 'c9d1f4a6b2e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('astrologer_profiles', sa.Column('is_premium', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column('astrologer_profiles', 'is_premium')
