"""add_source_to_error_logs

Revision ID: a4d8e2f1c6b9
Revises: c3a75f318dda
Create Date: 2026-08-11 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a4d8e2f1c6b9'
down_revision: Union[str, Sequence[str], None] = 'c3a75f318dda'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'error_logs',
        sa.Column('source', sa.String(), nullable=False, server_default='server'),
    )
    op.create_index('ix_error_logs_source', 'error_logs', ['source'])


def downgrade() -> None:
    op.drop_index('ix_error_logs_source', table_name='error_logs')
    op.drop_column('error_logs', 'source')
