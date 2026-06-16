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
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # 1. Create chat_packages table if it doesn't exist
    if 'chat_packages' not in tables:
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

    # 2. Add columns to consultations if they don't exist
    columns = [col['name'] for col in inspector.get_columns('consultations')]
    if 'package_id' not in columns:
        op.add_column('consultations', sa.Column('package_id', sa.Integer(), nullable=True))
    if 'package_seconds_remaining' not in columns:
        op.add_column('consultations', sa.Column('package_seconds_remaining', sa.Integer(), nullable=True))
    
    # 3. Add foreign key constraint to consultations if it doesn't exist
    fks = inspector.get_foreign_keys('consultations')
    fk_names = [fk['name'] for fk in fks]
    if 'fk_consultations_package' not in fk_names:
        op.create_foreign_key(
            'fk_consultations_package',
            'consultations',
            'chat_packages',
            ['package_id'],
            ['id']
        )


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    # Drop foreign key constraint first if it exists
    if 'consultations' in tables:
        fks = inspector.get_foreign_keys('consultations')
        fk_names = [fk['name'] for fk in fks]
        if 'fk_consultations_package' in fk_names:
            op.drop_constraint('fk_consultations_package', 'consultations', type_='foreignkey')
        
        # Drop columns from consultations if they exist
        columns = [col['name'] for col in inspector.get_columns('consultations')]
        if 'package_seconds_remaining' in columns:
            op.drop_column('consultations', 'package_seconds_remaining')
        if 'package_id' in columns:
            op.drop_column('consultations', 'package_id')
    
    # Drop chat_packages table if it exists
    if 'chat_packages' in tables:
        op.drop_index(op.f('ix_chat_packages_id'), table_name='chat_packages')
        op.drop_table('chat_packages')

