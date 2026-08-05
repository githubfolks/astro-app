"""add_short_description_to_content_studio_jobs

Revision ID: 2f6a91b0d3e5
Revises: 1c31cdc18a34
Create Date: 2026-08-05 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2f6a91b0d3e5'
down_revision: Union[str, Sequence[str], None] = '1c31cdc18a34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('content_studio_jobs', sa.Column('short_description', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('content_studio_jobs', 'short_description')
