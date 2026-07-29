"""add onboarding reminder tracking to astrologer_profiles

Revision ID: f7a9c2e1b3d5
Revises: 493c58105162
Create Date: 2026-07-29 00:00:00.000000

Adds the fields needed to nudge astrologers who stall mid-onboarding:
onboarding_stage_updated_at (clock for "stuck for N days"), plus a reminder
count/last-sent pair so we can cap nudges and avoid re-sending same-day.
Backfills onboarding_stage_updated_at from created-ish state so existing rows
already in a non-terminal stage become eligible once they cross 5 days out.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f7a9c2e1b3d5'
down_revision: Union[str, Sequence[str], None] = '493c58105162'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('astrologer_profiles', sa.Column('onboarding_stage_updated_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('onboarding_reminder_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('astrologer_profiles', sa.Column('onboarding_reminder_last_sent_at', sa.DateTime(timezone=True), nullable=True))

    bind = op.get_bind()
    # Seed the clock from the user's signup time so already-stalled profiles
    # aren't silently exempt until their next (possibly nonexistent) stage change.
    bind.execute(sa.text(
        """
        UPDATE astrologer_profiles
        SET onboarding_stage_updated_at = (
            SELECT users.created_at FROM users WHERE users.id = astrologer_profiles.user_id
        )
        WHERE onboarding_stage_updated_at IS NULL
        """
    ))


def downgrade() -> None:
    op.drop_column('astrologer_profiles', 'onboarding_reminder_last_sent_at')
    op.drop_column('astrologer_profiles', 'onboarding_reminder_count')
    op.drop_column('astrologer_profiles', 'onboarding_stage_updated_at')
