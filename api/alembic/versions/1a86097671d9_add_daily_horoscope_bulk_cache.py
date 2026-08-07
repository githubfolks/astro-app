"""add_daily_horoscope_bulk_cache

Revision ID: 1a86097671d9
Revises: 2f6a91b0d3e5
Create Date: 2026-08-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '1a86097671d9'
down_revision: Union[str, Sequence[str], None] = '2f6a91b0d3e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('daily_horoscope_bulk',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('horoscope_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_daily_horoscope_bulk_id'), 'daily_horoscope_bulk', ['id'], unique=False)
    op.create_index('ix_daily_horoscope_bulk_lookup', 'daily_horoscope_bulk', ['date'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_daily_horoscope_bulk_lookup', table_name='daily_horoscope_bulk')
    op.drop_index(op.f('ix_daily_horoscope_bulk_id'), table_name='daily_horoscope_bulk')
    op.drop_table('daily_horoscope_bulk')
