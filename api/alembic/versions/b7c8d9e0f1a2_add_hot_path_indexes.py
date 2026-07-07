"""Add indexes for hot-path queries.

Covers the filters used by the astrologer listing (availability/queue counts),
chat history, wallet history, availability notifications, and push tokens.

Revision ID: b7c8d9e0f1a2
Revises: d4e5f6a7b8c9
Create Date: 2026-07-07
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEXES = [
    ("ix_consultations_astrologer_id_status", "consultations", ["astrologer_id", "status"]),
    ("ix_consultations_seeker_id_status", "consultations", ["seeker_id", "status"]),
    ("ix_chat_messages_consultation_id", "chat_messages", ["consultation_id"]),
    ("ix_wallet_transactions_user_id", "wallet_transactions", ["user_id"]),
    ("ix_availability_notifications_astrologer_id_notified", "availability_notifications", ["astrologer_id", "notified"]),
    ("ix_device_tokens_user_id", "device_tokens", ["user_id"]),
]


def upgrade() -> None:
    for name, table, cols in INDEXES:
        op.create_index(name, table, cols, if_not_exists=True)


def downgrade() -> None:
    for name, table, _cols in INDEXES:
        op.drop_index(name, table_name=table, if_exists=True)
