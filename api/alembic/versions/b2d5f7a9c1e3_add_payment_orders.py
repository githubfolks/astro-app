"""add payment_orders table

Revision ID: b2d5f7a9c1e3
Revises: a1c4e6f2d8b7
Create Date: 2026-07-29 00:00:00.000000

Persists orders created by POST /payment/order (mock and real) so
/payment/verify can look up the amount the platform actually quoted for that
order id, instead of trusting a value parsed out of a client-supplied string
(previously the case for mock orders, where the order id itself encoded the
amount and was never checked against anything server-side).
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b2d5f7a9c1e3'
down_revision: Union[str, Sequence[str], None] = 'a1c4e6f2d8b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'payment_orders',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('order_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('amount_paise', sa.Integer(), nullable=False),
        sa.Column('is_mock', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('consumed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_payment_orders_order_id', 'payment_orders', ['order_id'], unique=True)
    op.create_index('ix_payment_orders_user_id', 'payment_orders', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_payment_orders_user_id', table_name='payment_orders')
    op.drop_index('ix_payment_orders_order_id', table_name='payment_orders')
    op.drop_table('payment_orders')
