"""add wallet_packages and bonus tracking on payment_orders

Revision ID: d3f8a1c9b2e5
Revises: eb134663ee2a
Create Date: 2026-08-15 00:00:00.000000

Adds admin-configurable bonus recharge tiers (e.g. "pay 500, get 550 wallet
credit") — see WalletPackage in models.py. payment_orders gets a snapshot of
the chosen package's bonus at order-creation time, and wallet_transactions
gets a new WALLET_BONUS type so the bonus is a separate, auditable credit
from the actual gateway payment (keeping refund accounting — which only
refunds real money — unaffected by any bonus).
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd3f8a1c9b2e5'
down_revision: Union[str, Sequence[str], None] = 'eb134663ee2a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'wallet_packages',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('amount', sa.DECIMAL(10, 2), nullable=False),
        sa.Column('bonus_amount', sa.DECIMAL(10, 2), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.add_column('payment_orders', sa.Column('wallet_package_id', sa.Integer(), sa.ForeignKey('wallet_packages.id'), nullable=True))
    op.add_column('payment_orders', sa.Column('bonus_amount', sa.DECIMAL(10, 2), nullable=False, server_default='0'))

    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'WALLET_BONUS'")
    # PACKAGE_PURCHASE was added to the Python enum (models.py) for the chat
    # package checkout flow (routers/packages.py) but no prior migration ever
    # added it to the Postgres enum type — that endpoint would fail at
    # runtime with an invalid-enum-value error. Fixing it here since it's the
    # same enum type this migration already alters.
    op.execute("ALTER TYPE transactiontype ADD VALUE IF NOT EXISTS 'PACKAGE_PURCHASE'")
    # No separate uniqueness guard needed for WALLET_BONUS rows: they're
    # always inserted in the same db.commit() as the order's PAYMENT_GATEWAY
    # row (see /payment/verify and the Razorpay webhook), so the existing
    # partial unique index on PAYMENT_GATEWAY.reference_id (a1c4e6f2d8b7)
    # already makes the whole credit atomic — a raced duplicate rolls back
    # both rows together.


def downgrade() -> None:
    op.drop_column('payment_orders', 'bonus_amount')
    op.drop_column('payment_orders', 'wallet_package_id')
    op.drop_table('wallet_packages')
    # Postgres does not support dropping a value from an enum type.
