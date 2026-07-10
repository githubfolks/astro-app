"""add_content_studio_social_posting

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-07-11 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('content_studio_jobs', sa.Column('posted_facebook_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('content_studio_jobs', sa.Column('posted_instagram_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('content_studio_jobs', sa.Column('posted_youtube_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('content_studio_jobs', 'posted_youtube_at')
    op.drop_column('content_studio_jobs', 'posted_instagram_at')
    op.drop_column('content_studio_jobs', 'posted_facebook_at')
