"""enforce one wallet credit per payment gateway order

Revision ID: a1c4e6f2d8b7
Revises: f7a9c2e1b3d5
Create Date: 2026-07-29 00:00:00.000000

Adds a partial unique index on wallet_transactions.reference_id, scoped to
transaction_type='PAYMENT_GATEWAY' only, so a raced /payment/verify (or a race
between /payment/verify and the Razorpay webhook) can no longer credit the
same order twice — the second INSERT now fails with a DB-level IntegrityError
instead of relying solely on a SELECT-then-INSERT check-then-act.

Scoped to PAYMENT_GATEWAY specifically because reference_id is reused for
other transaction types where repeats are legitimate: CHAT_DEDUCTION rows
reference a consultation id repeatedly (per-minute billing), and
PAYMENT_REFUND rows share the original order's reference_id across partial
refunds.
"""
from typing import Sequence, Union
from alembic import op

revision: str = 'a1c4e6f2d8b7'
down_revision: Union[str, Sequence[str], None] = 'f7a9c2e1b3d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        'ux_wallet_transactions_payment_gateway_reference_id',
        'wallet_transactions',
        ['reference_id'],
        unique=True,
        postgresql_where="transaction_type = 'PAYMENT_GATEWAY'",
    )


def downgrade() -> None:
    op.drop_index(
        'ux_wallet_transactions_payment_gateway_reference_id',
        table_name='wallet_transactions',
    )
