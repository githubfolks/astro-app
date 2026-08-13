"""add_tags_keywords_to_posts

Revision ID: e7f8a9b0c1d2
Revises: a4d8e2f1c6b9
Create Date: 2026-08-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7f8a9b0c1d2'
down_revision: Union[str, Sequence[str], None] = 'a4d8e2f1c6b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('posts', sa.Column('tags', sa.JSON(), nullable=True))
    op.add_column('posts', sa.Column('secondary_keywords', sa.JSON(), nullable=True))
    op.add_column('posts', sa.Column('longtail_keywords', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('posts', 'longtail_keywords')
    op.drop_column('posts', 'secondary_keywords')
    op.drop_column('posts', 'tags')
