"""add_aadhaar_back_doc_url

Revision ID: c30883ea16f8
Revises: 8b3ae1e7e1d8
Create Date: 2026-07-27 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c30883ea16f8'
down_revision: Union[str, Sequence[str], None] = '8b3ae1e7e1d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('astrologer_profiles', sa.Column('aadhaar_doc_back_url', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('astrologer_profiles', 'aadhaar_doc_back_url')
