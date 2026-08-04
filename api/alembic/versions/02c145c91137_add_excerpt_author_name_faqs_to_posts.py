"""add_excerpt_author_name_faqs_to_posts

Revision ID: 02c145c91137
Revises: bf925cf98633
Create Date: 2026-08-04 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '02c145c91137'
down_revision: Union[str, Sequence[str], None] = 'bf925cf98633'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('posts', sa.Column('excerpt', sa.Text(), nullable=True))
    op.add_column('posts', sa.Column('author_name', sa.String(), nullable=True))
    op.add_column('posts', sa.Column('faqs', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('posts', 'faqs')
    op.drop_column('posts', 'author_name')
    op.drop_column('posts', 'excerpt')
