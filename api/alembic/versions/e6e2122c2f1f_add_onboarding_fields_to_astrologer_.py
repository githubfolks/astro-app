"""add_onboarding_fields_to_astrologer_profile

Revision ID: e6e2122c2f1f
Revises: e8f4c7d9a1b2
Create Date: 2026-02-01 23:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e6e2122c2f1f'
down_revision: Union[str, Sequence[str], None] = 'e8f4c7d9a1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add columns to astrologer_profiles
    op.add_column('astrologer_profiles', sa.Column('city', sa.String(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('id_proof_url', sa.String(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('astrology_types', sa.JSON(), nullable=True))
    op.add_column('astrologer_profiles', sa.Column('is_approved', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('astrologer_profiles', sa.Column('legal_agreement_accepted', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('astrologer_profiles', sa.Column('legal_agreement_accepted_at', sa.DateTime(timezone=True), nullable=True))

def downgrade() -> None:
    op.drop_column('astrologer_profiles', 'legal_agreement_accepted_at')
    op.drop_column('astrologer_profiles', 'legal_agreement_accepted')
    op.drop_column('astrologer_profiles', 'is_approved')
    op.drop_column('astrologer_profiles', 'astrology_types')
    op.drop_column('astrologer_profiles', 'id_proof_url')
    op.drop_column('astrologer_profiles', 'city')
