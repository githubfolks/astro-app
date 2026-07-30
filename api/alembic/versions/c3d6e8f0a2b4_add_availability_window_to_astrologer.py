"""add availability window to astrologer profiles

Revision ID: c3d6e8f0a2b4
Revises: a1c3e5f7b9d2
Create Date: 2026-07-30 00:00:00.000000

Adds a structured daily start/end time so the Knock feature can be enabled
only during an astrologer's actual availability window, instead of any time
they happen to be offline. availability_hours (freeform text) is kept as-is
for the display label shown on cards/profiles.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c3d6e8f0a2b4'
down_revision: Union[str, Sequence[str], None] = 'a1c3e5f7b9d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('astrologer_profiles', sa.Column('availability_start_time', sa.Time(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('availability_end_time', sa.Time(), nullable=True))


def downgrade() -> None:
    op.drop_column('astrologer_profiles', 'availability_end_time')
    op.drop_column('astrologer_profiles', 'availability_start_time')
