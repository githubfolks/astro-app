"""add youtube video id to content studio jobs

Revision ID: 06f100a29e52
Revises: 272a51ca4b40
Create Date: 2026-08-03 14:45:48.157833

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '06f100a29e52'
down_revision: Union[str, Sequence[str], None] = '272a51ca4b40'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('content_studio_jobs', sa.Column('youtube_video_id', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('content_studio_jobs', 'youtube_video_id')
