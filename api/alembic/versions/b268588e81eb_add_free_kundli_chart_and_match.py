"""add_free_kundli_chart_and_match

Revision ID: b268588e81eb
Revises: 1a86097671d9
Create Date: 2026-08-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b268588e81eb'
down_revision: Union[str, Sequence[str], None] = '1a86097671d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('free_kundli_charts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('time_of_birth', sa.Time(), nullable=False),
        sa.Column('place_of_birth', sa.String(), nullable=False),
        sa.Column('chart_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_free_kundli_charts_id'), 'free_kundli_charts', ['id'], unique=False)
    op.create_index('ix_free_kundli_charts_lookup', 'free_kundli_charts',
        ['date_of_birth', 'time_of_birth', 'place_of_birth'], unique=True)

    op.create_table('free_match_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('boy_full_name', sa.String(), nullable=True),
        sa.Column('boy_date_of_birth', sa.Date(), nullable=False),
        sa.Column('boy_time_of_birth', sa.Time(), nullable=False),
        sa.Column('boy_place_of_birth', sa.String(), nullable=False),
        sa.Column('girl_full_name', sa.String(), nullable=True),
        sa.Column('girl_date_of_birth', sa.Date(), nullable=False),
        sa.Column('girl_time_of_birth', sa.Time(), nullable=False),
        sa.Column('girl_place_of_birth', sa.String(), nullable=False),
        sa.Column('match_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_free_match_reports_id'), 'free_match_reports', ['id'], unique=False)
    op.create_index('ix_free_match_reports_lookup', 'free_match_reports',
        ['boy_date_of_birth', 'boy_time_of_birth', 'boy_place_of_birth',
         'girl_date_of_birth', 'girl_time_of_birth', 'girl_place_of_birth'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_free_match_reports_lookup', table_name='free_match_reports')
    op.drop_index(op.f('ix_free_match_reports_id'), table_name='free_match_reports')
    op.drop_table('free_match_reports')

    op.drop_index('ix_free_kundli_charts_lookup', table_name='free_kundli_charts')
    op.drop_index(op.f('ix_free_kundli_charts_id'), table_name='free_kundli_charts')
    op.drop_table('free_kundli_charts')
