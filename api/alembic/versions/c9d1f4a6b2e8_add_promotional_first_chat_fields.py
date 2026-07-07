"""add_promotional_first_chat_fields

Revision ID: c9d1f4a6b2e8
Revises: a7c3e5f9b1d4
Create Date: 2026-07-07 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c9d1f4a6b2e8'
down_revision: Union[str, Sequence[str], None] = 'a7c3e5f9b1d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('consultations', sa.Column('is_promotional_first_chat', sa.Boolean(), nullable=True, server_default=sa.false()))
    op.add_column('consultations', sa.Column('promotional_rate_total', sa.DECIMAL(10, 2), nullable=True))


def downgrade() -> None:
    op.drop_column('consultations', 'promotional_rate_total')
    op.drop_column('consultations', 'is_promotional_first_chat')
