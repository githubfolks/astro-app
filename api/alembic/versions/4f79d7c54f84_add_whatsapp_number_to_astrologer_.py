"""add_whatsapp_number_to_astrologer_profile

Revision ID: 4f79d7c54f84
Revises: 68fd743a5441
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '4f79d7c54f84'
down_revision: Union[str, Sequence[str], None] = '68fd743a5441'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('astrologer_profiles', sa.Column('whatsapp_number', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('astrologer_profiles', 'whatsapp_number')
