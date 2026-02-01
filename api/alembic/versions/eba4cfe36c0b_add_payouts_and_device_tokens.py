"""add_payouts_and_device_tokens

Revision ID: eba4cfe36c0b
Revises: e6e2122c2f1f
Create Date: 2026-02-01 23:25:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'eba4cfe36c0b'
down_revision: Union[str, Sequence[str], None] = 'e6e2122c2f1f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Update TransactionType Enum
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'PAYMENT_GATEWAY'")

    # 2. Add commission_percentage to astrologer_profiles
    op.add_column('astrologer_profiles', sa.Column('commission_percentage', sa.Numeric(precision=5, scale=2), server_default='70.0', nullable=True))

    # 3. Handle PayoutStatus Enum and Payout table
    # Check if type exists manually to avoid DuplicateObject error
    op.execute("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payoutstatus') THEN CREATE TYPE payoutstatus AS ENUM ('PENDING', 'PROCESSED'); END IF; END $$;")

    op.create_table('payouts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('astrologer_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('status', postgresql.ENUM('PENDING', 'PROCESSED', name='payoutstatus', create_type=False), nullable=True),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('transaction_reference', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['astrologer_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payouts_id'), 'payouts', ['id'], unique=False)

    # 4. Create DeviceToken table
    op.create_table('device_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('fcm_token', sa.String(), nullable=False),
        sa.Column('platform', sa.String(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_device_tokens_fcm_token'), 'device_tokens', ['fcm_token'], unique=True)
    op.create_index(op.f('ix_device_tokens_id'), 'device_tokens', ['id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_device_tokens_id'), table_name='device_tokens')
    op.drop_index(op.f('ix_device_tokens_fcm_token'), table_name='device_tokens')
    op.drop_table('device_tokens')
    op.drop_index(op.f('ix_payouts_id'), table_name='payouts')
    op.drop_table('payouts')
    op.drop_column('astrologer_profiles', 'commission_percentage')
