"""add_contract_kyc_gallery_certificate_fields

Revision ID: 2c062ba620d6
Revises: 4f79d7c54f84
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '2c062ba620d6'
down_revision: Union[str, Sequence[str], None] = '4f79d7c54f84'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('astrologer_profiles', sa.Column('contract_signed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('contract_signature_name', sa.String(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('pan_number', sa.String(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('pan_doc_url', sa.String(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('aadhaar_number', sa.String(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('aadhaar_doc_url', sa.String(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('bank_account_holder_name', sa.String(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('bank_account_number', sa.String(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('bank_ifsc', sa.String(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('gallery_photo_urls', sa.JSON(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('certificate_urls', sa.JSON(), nullable=True))

def downgrade() -> None:
    op.drop_column('astrologer_profiles', 'certificate_urls')
    op.drop_column('astrologer_profiles', 'gallery_photo_urls')
    op.drop_column('astrologer_profiles', 'bank_ifsc')
    op.drop_column('astrologer_profiles', 'bank_account_number')
    op.drop_column('astrologer_profiles', 'bank_account_holder_name')
    op.drop_column('astrologer_profiles', 'aadhaar_doc_url')
    op.drop_column('astrologer_profiles', 'aadhaar_number')
    op.drop_column('astrologer_profiles', 'pan_doc_url')
    op.drop_column('astrologer_profiles', 'pan_number')
    op.drop_column('astrologer_profiles', 'contract_signature_name')
    op.drop_column('astrologer_profiles', 'contract_signed_at')
