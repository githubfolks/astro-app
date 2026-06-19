"""add onboarding_stage and onboarding_meta to astrologer_profiles

Revision ID: d4e5f6a7b8c9
Revises: c1d2e3f4a5b6
Create Date: 2026-06-19 00:00:00.000000

Adds the multi-step onboarding pipeline stage (Kanban) plus a JSON blob that
persists the last-entered per-step email fields for card re-display. Backfills
existing rows: approved astrologers land in COMPLETED, everyone else in APPLIED.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = 'c1d2e3f4a5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


onboarding_stage_enum = sa.Enum(
    'APPLIED',
    'INTERVIEW_SCHEDULED',
    'PROFILE_ACTIVATED',
    'ONBOARDING_INTIMATED',
    'ONBOARDING_STARTED',
    'TRAINING_SCHEDULED',
    'COMPLETED',
    'REJECTED',
    name='onboardingstage',
)


def upgrade() -> None:
    bind = op.get_bind()
    # No-op on SQLite; creates the native enum type on Postgres.
    onboarding_stage_enum.create(bind, checkfirst=True)

    op.add_column(
        'astrologer_profiles',
        sa.Column('onboarding_stage', onboarding_stage_enum, nullable=False, server_default='APPLIED'),
    )
    op.add_column('astrologer_profiles', sa.Column('onboarding_meta', sa.JSON(), nullable=True))

    # Backfill: already-approved astrologers are effectively onboarded.
    bind.execute(sa.text(
        "UPDATE astrologer_profiles SET onboarding_stage = 'COMPLETED' WHERE is_approved"
    ))


def downgrade() -> None:
    op.drop_column('astrologer_profiles', 'onboarding_meta')
    op.drop_column('astrologer_profiles', 'onboarding_stage')
    onboarding_stage_enum.drop(op.get_bind(), checkfirst=True)
