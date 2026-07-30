"""add razorpay_mode to payment_orders

Revision ID: d4e7f9a1b3c5
Revises: c3d6e8f0a2b4
Create Date: 2026-07-30 00:00:00.000000

Records which Razorpay key mode ('test' or 'live') was active when an order
was created, so /payment/verify and admin refunds use the same key pair the
order was actually placed under, even if an admin flips the mode in Settings
while the order is still in flight.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd4e7f9a1b3c5'
down_revision: Union[str, Sequence[str], None] = 'c3d6e8f0a2b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('payment_orders', sa.Column('razorpay_mode', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('payment_orders', 'razorpay_mode')
