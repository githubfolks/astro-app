"""add_panchang_cache_matching_muhurat_and_dasha_insights

Revision ID: 68fd743a5441
Revises: e4f5a6b7c8d9
Create Date: 2026-07-14 22:09:46.103520

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '68fd743a5441'
down_revision: Union[str, Sequence[str], None] = 'e4f5a6b7c8d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('panchang_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('latitude', sa.DECIMAL(precision=6, scale=2), nullable=False),
        sa.Column('longitude', sa.DECIMAL(precision=6, scale=2), nullable=False),
        sa.Column('place_label', sa.String(), nullable=True),
        sa.Column('timezone', sa.String(), nullable=True),
        sa.Column('panchang_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_panchang_cache_id'), 'panchang_cache', ['id'], unique=False)
    op.create_index('ix_panchang_cache_lookup', 'panchang_cache', ['date', 'latitude', 'longitude'], unique=True)

    op.create_table('kundli_match_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('generated_by', sa.Integer(), nullable=False),
        sa.Column('boy_seeker_id', sa.Integer(), nullable=True),
        sa.Column('girl_seeker_id', sa.Integer(), nullable=True),
        sa.Column('boy_full_name', sa.String(), nullable=True),
        sa.Column('boy_date_of_birth', sa.Date(), nullable=False),
        sa.Column('boy_time_of_birth', sa.Time(), nullable=False),
        sa.Column('boy_place_of_birth', sa.String(), nullable=False),
        sa.Column('boy_latitude', sa.DECIMAL(precision=10, scale=6), nullable=True),
        sa.Column('boy_longitude', sa.DECIMAL(precision=10, scale=6), nullable=True),
        sa.Column('girl_full_name', sa.String(), nullable=True),
        sa.Column('girl_date_of_birth', sa.Date(), nullable=False),
        sa.Column('girl_time_of_birth', sa.Time(), nullable=False),
        sa.Column('girl_place_of_birth', sa.String(), nullable=False),
        sa.Column('girl_latitude', sa.DECIMAL(precision=10, scale=6), nullable=True),
        sa.Column('girl_longitude', sa.DECIMAL(precision=10, scale=6), nullable=True),
        sa.Column('match_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['boy_seeker_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['generated_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['girl_seeker_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_kundli_match_reports_id'), 'kundli_match_reports', ['id'], unique=False)
    op.create_index('ix_kundli_match_reports_lookup', 'kundli_match_reports',
        ['boy_date_of_birth', 'boy_time_of_birth', 'boy_place_of_birth',
         'girl_date_of_birth', 'girl_time_of_birth', 'girl_place_of_birth'], unique=False)

    op.create_table('muhurat_searches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('generated_by', sa.Integer(), nullable=False),
        sa.Column('seeker_id', sa.Integer(), nullable=True),
        sa.Column('purpose', sa.String(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('place', sa.String(), nullable=False),
        sa.Column('latitude', sa.DECIMAL(precision=6, scale=2), nullable=False),
        sa.Column('longitude', sa.DECIMAL(precision=6, scale=2), nullable=False),
        sa.Column('personalized', sa.Boolean(), nullable=False),
        sa.Column('subject_date_of_birth', sa.Date(), nullable=True),
        sa.Column('subject_time_of_birth', sa.Time(), nullable=True),
        sa.Column('subject_place_of_birth', sa.String(), nullable=True),
        sa.Column('muhurat_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['generated_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['seeker_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_muhurat_searches_id'), 'muhurat_searches', ['id'], unique=False)
    op.create_index('ix_muhurat_searches_lookup', 'muhurat_searches',
        ['purpose', 'start_date', 'end_date', 'latitude', 'longitude', 'personalized',
         'subject_date_of_birth', 'subject_time_of_birth', 'subject_place_of_birth'], unique=False)

    op.add_column('kundli_reports', sa.Column('dasha_insights_data', sa.JSON(), nullable=True))
    op.add_column('kundli_reports', sa.Column('dasha_insights_date', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('kundli_reports', 'dasha_insights_date')
    op.drop_column('kundli_reports', 'dasha_insights_data')

    op.drop_index('ix_muhurat_searches_lookup', table_name='muhurat_searches')
    op.drop_index(op.f('ix_muhurat_searches_id'), table_name='muhurat_searches')
    op.drop_table('muhurat_searches')

    op.drop_index('ix_kundli_match_reports_lookup', table_name='kundli_match_reports')
    op.drop_index(op.f('ix_kundli_match_reports_id'), table_name='kundli_match_reports')
    op.drop_table('kundli_match_reports')

    op.drop_index('ix_panchang_cache_lookup', table_name='panchang_cache')
    op.drop_index(op.f('ix_panchang_cache_id'), table_name='panchang_cache')
    op.drop_table('panchang_cache')
