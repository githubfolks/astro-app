"""add_seo_keywords_to_posts

Revision ID: 815decd807dd
Revises: 02c145c91137
Create Date: 2026-08-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '815decd807dd'
down_revision: Union[str, Sequence[str], None] = '02c145c91137'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('posts', sa.Column('seo_keywords_facebook', sa.Text(), nullable=True))
    op.add_column('posts', sa.Column('seo_keywords_instagram', sa.Text(), nullable=True))
    op.add_column('posts', sa.Column('seo_keywords_youtube', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('posts', 'seo_keywords_youtube')
    op.drop_column('posts', 'seo_keywords_instagram')
    op.drop_column('posts', 'seo_keywords_facebook')
