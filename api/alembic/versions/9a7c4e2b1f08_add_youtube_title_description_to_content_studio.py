"""add_youtube_title_description_to_content_studio_jobs

Revision ID: 9a7c4e2b1f08
Revises: d3f8a1c9b2e5
Create Date: 2026-08-19 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a7c4e2b1f08'
down_revision: Union[str, Sequence[str], None] = 'd3f8a1c9b2e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('content_studio_jobs', sa.Column('youtube_title', sa.String(), nullable=True))
    op.add_column('content_studio_jobs', sa.Column('youtube_description', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('content_studio_jobs', 'youtube_description')
    op.drop_column('content_studio_jobs', 'youtube_title')
