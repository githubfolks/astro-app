"""add_chat_image_messages

Revision ID: ac5aab4b5544
Revises: c3d4e5f6a7b8
Create Date: 2026-07-14 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'ac5aab4b5544'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'chat_messages',
        sa.Column('message_type', sa.String(), nullable=False, server_default='text'),
    )
    op.add_column(
        'chat_messages',
        sa.Column('media_url', sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('chat_messages', 'media_url')
    op.drop_column('chat_messages', 'message_type')
