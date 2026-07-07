"""add_admin_comments_to_payouts

Revision ID: cee32ee05821
Revises: 2a2d82951001
Create Date: 2026-07-07 23:20:46.826687

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'cee32ee05821'
down_revision: Union[str, Sequence[str], None] = '2a2d82951001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('payouts', sa.Column('admin_comments', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('payouts', 'admin_comments')
