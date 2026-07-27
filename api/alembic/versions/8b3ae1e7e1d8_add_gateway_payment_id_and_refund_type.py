"""add_gateway_payment_id_and_refund_type

Revision ID: 8b3ae1e7e1d8
Revises: c01309f9b27f
Create Date: 2026-07-27 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '8b3ae1e7e1d8'
down_revision: Union[str, Sequence[str], None] = 'c01309f9b27f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('wallet_transactions', sa.Column('gateway_payment_id', sa.String(), nullable=True))
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'PAYMENT_REFUND'")

def downgrade() -> None:
    op.drop_column('wallet_transactions', 'gateway_payment_id')
    # Postgres does not support dropping a value from an enum type.
