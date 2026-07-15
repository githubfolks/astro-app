"""drop_gallery_add_kyc_verified

Revision ID: fb1dc750ae32
Revises: 2c062ba620d6
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'fb1dc750ae32'
down_revision: Union[str, Sequence[str], None] = '2c062ba620d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.drop_column('astrologer_profiles', 'gallery_photo_urls')
    op.add_column('astrologer_profiles', sa.Column('kyc_verified', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('astrologer_profiles', sa.Column('kyc_verified_at', sa.DateTime(timezone=True), nullable=True))

def downgrade() -> None:
    op.drop_column('astrologer_profiles', 'kyc_verified_at')
    op.drop_column('astrologer_profiles', 'kyc_verified')
    op.add_column('astrologer_profiles', sa.Column('gallery_photo_urls', sa.JSON(), nullable=True))
