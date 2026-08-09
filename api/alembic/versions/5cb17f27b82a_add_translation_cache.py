"""add_translation_cache

Revision ID: 5cb17f27b82a
Revises: b268588e81eb
Create Date: 2026-08-09 20:54:03.237333

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5cb17f27b82a'
down_revision: Union[str, Sequence[str], None] = 'b268588e81eb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'translation_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('text_hash', sa.String(length=64), nullable=False),
        sa.Column('target_lang', sa.String(length=8), nullable=False),
        sa.Column('source_text', sa.Text(), nullable=False),
        sa.Column('translated_text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_translation_cache_id'), 'translation_cache', ['id'], unique=False)
    op.create_index('ix_translation_cache_lookup', 'translation_cache', ['text_hash', 'target_lang'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_translation_cache_lookup', table_name='translation_cache')
    op.drop_index(op.f('ix_translation_cache_id'), table_name='translation_cache')
    op.drop_table('translation_cache')
