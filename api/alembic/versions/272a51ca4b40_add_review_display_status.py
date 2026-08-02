"""add_review_display_status

Revision ID: 272a51ca4b40
Revises: ed096150dd3e
Create Date: 2026-08-02 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '272a51ca4b40'
down_revision: Union[str, Sequence[str], None] = 'ed096150dd3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

review_display_status = sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='reviewdisplaystatus')


def upgrade() -> None:
    review_display_status.create(op.get_bind(), checkfirst=True)
    op.add_column('reviews', sa.Column('display_status', review_display_status, nullable=False, server_default='PENDING'))
    op.add_column('reviews', sa.Column('moderation_reason', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('reviews', 'moderation_reason')
    op.drop_column('reviews', 'display_status')
    review_display_status.drop(op.get_bind(), checkfirst=True)
