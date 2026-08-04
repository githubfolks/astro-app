"""add_seo_keywords_to_content_studio_jobs

Revision ID: 1c31cdc18a34
Revises: 815decd807dd
Create Date: 2026-08-05 00:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c31cdc18a34'
down_revision: Union[str, Sequence[str], None] = '815decd807dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('content_studio_jobs', sa.Column('seo_keywords_facebook', sa.Text(), nullable=True))
    op.add_column('content_studio_jobs', sa.Column('seo_keywords_instagram', sa.Text(), nullable=True))
    op.add_column('content_studio_jobs', sa.Column('seo_keywords_youtube', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('content_studio_jobs', 'seo_keywords_youtube')
    op.drop_column('content_studio_jobs', 'seo_keywords_instagram')
    op.drop_column('content_studio_jobs', 'seo_keywords_facebook')
