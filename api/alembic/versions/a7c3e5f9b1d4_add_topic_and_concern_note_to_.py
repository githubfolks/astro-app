"""add_topic_and_concern_note_to_consultations

Revision ID: a7c3e5f9b1d4
Revises: b7c8d9e0f1a2
Create Date: 2026-07-07 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a7c3e5f9b1d4'
down_revision: Union[str, Sequence[str], None] = 'b7c8d9e0f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('consultations', sa.Column('topic', sa.String(), nullable=True))
    op.add_column('consultations', sa.Column('concern_note', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('consultations', 'concern_note')
    op.drop_column('consultations', 'topic')
