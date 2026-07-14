"""add_astrologer_online_sessions

Revision ID: e4f5a6b7c8d9
Revises: d3e4f5a6b7c8
Create Date: 2026-07-14 00:00:01.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e4f5a6b7c8d9'
down_revision: Union[str, Sequence[str], None] = 'd3e4f5a6b7c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'astrologer_online_sessions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('astrologer_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        'ix_astrologer_online_sessions_astrologer_id_ended_at',
        'astrologer_online_sessions', ['astrologer_id', 'ended_at'],
    )


def downgrade() -> None:
    op.drop_index('ix_astrologer_online_sessions_astrologer_id_ended_at', table_name='astrologer_online_sessions')
    op.drop_table('astrologer_online_sessions')
