"""add idempotency_key to wallet_transactions

Revision ID: a1c3e5f7b9d2
Revises: b2d5f7a9c1e3
Create Date: 2026-07-30 00:00:00.000000

Lets callers of the admin manual wallet credit/debit endpoint pass a
client-generated key so a retried/double-clicked request reuses the existing
transaction instead of double-crediting or double-debiting the wallet.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1c3e5f7b9d2'
down_revision: Union[str, Sequence[str], None] = 'b2d5f7a9c1e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('wallet_transactions', sa.Column('idempotency_key', sa.String(), nullable=True))
    op.create_index('ix_wallet_transactions_idempotency_key', 'wallet_transactions', ['idempotency_key'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_wallet_transactions_idempotency_key', table_name='wallet_transactions')
    op.drop_column('wallet_transactions', 'idempotency_key')
