"""add ai_astrologer_leads

Revision ID: b7d1e3f5a9c2
Revises: f1a2b3c4d5e6
Create Date: 2026-09-29 00:00:00.000000

Callback requests from guests who used up the AI Astrologer's free
questions. See AiAstrologerLead in models.py.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b7d1e3f5a9c2'
down_revision: Union[str, Sequence[str], None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# gendertype already exists (initial migration); the lead status type is new.
gender_enum = postgresql.ENUM('MALE', 'FEMALE', 'OTHER', name='gendertype', create_type=False)
lead_status_enum = postgresql.ENUM('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED', name='aiastrologerleadstatus', create_type=False)


def upgrade() -> None:
    lead_status_enum.create(op.get_bind(), checkfirst=True)
    op.create_table(
        'ai_astrologer_leads',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('phone_number', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('time_of_birth', sa.Time(), nullable=True),
        sa.Column('place_of_birth', sa.String(), nullable=False),
        sa.Column('gender', gender_enum, nullable=False),
        sa.Column('consent_text', sa.Text(), nullable=False),
        sa.Column('consented_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('request_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('status', lead_status_enum, nullable=False, server_default='NEW'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_ai_astrologer_leads_id', 'ai_astrologer_leads', ['id'])
    op.create_index('ix_ai_astrologer_leads_phone_number', 'ai_astrologer_leads', ['phone_number'], unique=True)
    op.create_index('ix_ai_astrologer_leads_status', 'ai_astrologer_leads', ['status'])


def downgrade() -> None:
    op.drop_index('ix_ai_astrologer_leads_status', table_name='ai_astrologer_leads')
    op.drop_index('ix_ai_astrologer_leads_phone_number', table_name='ai_astrologer_leads')
    op.drop_index('ix_ai_astrologer_leads_id', table_name='ai_astrologer_leads')
    op.drop_table('ai_astrologer_leads')
    lead_status_enum.drop(op.get_bind(), checkfirst=True)
