"""add_restricted_visibility_astrologers

Revision ID: ab6e20d4aeb6
Revises: d4e7f9a1b3c5
Create Date: 2026-07-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ab6e20d4aeb6'
down_revision: Union[str, Sequence[str], None] = 'd4e7f9a1b3c5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'astrologer_profiles',
        sa.Column('is_restricted', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.create_table(
        'astrologer_allowed_seekers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('astrologer_id', sa.Integer(), nullable=False),
        sa.Column('seeker_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['astrologer_id'], ['astrologer_profiles.user_id']),
        sa.ForeignKeyConstraint(['seeker_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('astrologer_id', 'seeker_id', name='uq_astrologer_allowed_seeker'),
    )
    op.create_index(
        op.f('ix_astrologer_allowed_seekers_astrologer_id'),
        'astrologer_allowed_seekers', ['astrologer_id'], unique=False,
    )
    op.create_index(
        op.f('ix_astrologer_allowed_seekers_seeker_id'),
        'astrologer_allowed_seekers', ['seeker_id'], unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_astrologer_allowed_seekers_seeker_id'), table_name='astrologer_allowed_seekers')
    op.drop_index(op.f('ix_astrologer_allowed_seekers_astrologer_id'), table_name='astrologer_allowed_seekers')
    op.drop_table('astrologer_allowed_seekers')
    op.drop_column('astrologer_profiles', 'is_restricted')
