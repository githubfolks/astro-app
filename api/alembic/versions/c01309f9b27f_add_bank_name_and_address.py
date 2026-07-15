"""add_bank_name_and_address

Revision ID: c01309f9b27f
Revises: fb1dc750ae32
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c01309f9b27f'
down_revision: Union[str, Sequence[str], None] = 'fb1dc750ae32'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('astrologer_profiles', sa.Column('bank_name', sa.String(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('bank_address', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('astrologer_profiles', 'bank_address')
    op.drop_column('astrologer_profiles', 'bank_name')
