"""add GST breakdown to payment_orders and users.deleted_at

Revision ID: c4e8a2d6f1b3
Revises: b7d1e3f5a9c2
Create Date: 2026-09-30 00:00:00.000000

GST is now charged on top of wallet recharges; each PaymentOrder snapshots
its base (wallet credit) amount, GST amount and rate. Existing orders keep
NULLs, which the payment router treats as pre-GST orders. users.deleted_at
marks self-deleted (anonymized) accounts.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c4e8a2d6f1b3'
down_revision: Union[str, Sequence[str], None] = 'b7d1e3f5a9c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('payment_orders', sa.Column('base_amount', sa.DECIMAL(10, 2), nullable=True))
    op.add_column('payment_orders', sa.Column('gst_amount', sa.DECIMAL(10, 2), nullable=True))
    op.add_column('payment_orders', sa.Column('gst_rate_percent', sa.DECIMAL(5, 2), nullable=True))
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'deleted_at')
    op.drop_column('payment_orders', 'gst_rate_percent')
    op.drop_column('payment_orders', 'gst_amount')
    op.drop_column('payment_orders', 'base_amount')
