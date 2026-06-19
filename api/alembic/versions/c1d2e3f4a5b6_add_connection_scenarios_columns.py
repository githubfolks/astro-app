"""add connection-scenarios columns (display_name, chat moderation flags)

Revision ID: c1d2e3f4a5b6
Revises: f3a8c1d2e9b4
Create Date: 2026-06-19 00:00:00.000000

New tables (app_settings, availability_notifications, moderation_flags) are
created by Base.metadata.create_all on startup; this migration only adds the
new columns to existing tables.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, Sequence[str], None] = 'f3a8c1d2e9b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Astrologer public stage name (Q7 identity protection)
    op.add_column('astrologer_profiles', sa.Column('display_name', sa.String(), nullable=True))
    # Chat moderation flags (Q6)
    op.add_column('chat_messages', sa.Column('is_flagged', sa.Boolean(), nullable=True, server_default=sa.false()))
    op.add_column('chat_messages', sa.Column('flag_reason', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('chat_messages', 'flag_reason')
    op.drop_column('chat_messages', 'is_flagged')
    op.drop_column('astrologer_profiles', 'display_name')
