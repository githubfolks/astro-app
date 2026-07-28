"""Add spouse details to consultation

Revision ID: 2f14b689bed0
Revises: c30883ea16f8
Create Date: 2026-07-28 16:06:53.648858

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '2f14b689bed0'
down_revision: Union[str, Sequence[str], None] = 'c30883ea16f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('consultations', sa.Column('spouse_name', sa.String(), nullable=True))
    op.add_column('consultations', sa.Column('spouse_date_of_birth', sa.Date(), nullable=True))
    op.add_column('consultations', sa.Column('spouse_time_of_birth', sa.Time(), nullable=True))
    op.add_column('consultations', sa.Column('spouse_place_of_birth', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('consultations', 'spouse_place_of_birth')
    op.drop_column('consultations', 'spouse_time_of_birth')
    op.drop_column('consultations', 'spouse_date_of_birth')
    op.drop_column('consultations', 'spouse_name')

