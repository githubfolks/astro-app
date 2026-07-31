"""add_free_tools_manglik_navamsa_numerology

Revision ID: ed096150dd3e
Revises: ab6e20d4aeb6
Create Date: 2026-07-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'ed096150dd3e'
down_revision: Union[str, Sequence[str], None] = 'ab6e20d4aeb6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('manglik_checks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('time_of_birth', sa.Time(), nullable=False),
        sa.Column('place_of_birth', sa.String(), nullable=False),
        sa.Column('yogas_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_manglik_checks_id'), 'manglik_checks', ['id'], unique=False)
    op.create_index('ix_manglik_checks_lookup', 'manglik_checks',
        ['date_of_birth', 'time_of_birth', 'place_of_birth'], unique=True)

    op.create_table('navamsa_charts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('time_of_birth', sa.Time(), nullable=False),
        sa.Column('place_of_birth', sa.String(), nullable=False),
        sa.Column('vargas_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_navamsa_charts_id'), 'navamsa_charts', ['id'], unique=False)
    op.create_index('ix_navamsa_charts_lookup', 'navamsa_charts',
        ['date_of_birth', 'time_of_birth', 'place_of_birth'], unique=True)

    op.create_table('numerology_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subject_name', sa.String(), nullable=False),
        sa.Column('date_of_birth', sa.Date(), nullable=False),
        sa.Column('method', sa.String(), nullable=False),
        sa.Column('profile_data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_numerology_profiles_id'), 'numerology_profiles', ['id'], unique=False)
    op.create_index('ix_numerology_profiles_lookup', 'numerology_profiles',
        ['subject_name', 'date_of_birth'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_numerology_profiles_lookup', table_name='numerology_profiles')
    op.drop_index(op.f('ix_numerology_profiles_id'), table_name='numerology_profiles')
    op.drop_table('numerology_profiles')

    op.drop_index('ix_navamsa_charts_lookup', table_name='navamsa_charts')
    op.drop_index(op.f('ix_navamsa_charts_id'), table_name='navamsa_charts')
    op.drop_table('navamsa_charts')

    op.drop_index('ix_manglik_checks_lookup', table_name='manglik_checks')
    op.drop_index(op.f('ix_manglik_checks_id'), table_name='manglik_checks')
    op.drop_table('manglik_checks')
