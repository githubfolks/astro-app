"""add_chat_packages_and_consultations_billing_fields

Revision ID: 8ae426bf6ed5
Revises: eba4cfe36c0b
Create Date: 2026-06-16 23:12:21.497972

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8ae426bf6ed5'
down_revision: Union[str, Sequence[str], None] = 'eba4cfe36c0b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Create chat_packages table
    op.create_table(
        'chat_packages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_packages_id'), 'chat_packages', ['id'], unique=False)

    # 2. Add columns to consultations
    op.add_column('consultations', sa.Column('package_id', sa.Integer(), nullable=True))
    op.add_column('consultations', sa.Column('package_seconds_remaining', sa.Integer(), nullable=True))
    
    # 3. Add foreign key constraint to consultations
    op.create_foreign_key(
        'fk_consultations_package',
        'consultations',
        'chat_packages',
        ['package_id'],
        ['id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop foreign key constraint first
    op.drop_constraint('fk_consultations_package', 'consultations', type_='foreignkey')
    
    # Drop columns from consultations
    op.drop_column('consultations', 'package_seconds_remaining')
    op.drop_column('consultations', 'package_id')
    
    # Drop chat_packages table
    op.drop_index(op.f('ix_chat_packages_id'), table_name='chat_packages')
    op.drop_table('chat_packages')

