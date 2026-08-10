"""add_oauth_provider_to_users

Revision ID: fb996b4b40b9
Revises: b268588e81eb
Create Date: 2026-08-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'fb996b4b40b9'
down_revision: Union[str, Sequence[str], None] = 'b268588e81eb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('oauth_provider', sa.String(), nullable=True))
    op.add_column('users', sa.Column('oauth_id', sa.String(), nullable=True))
    op.create_index(
        'ix_users_oauth_provider_id', 'users', ['oauth_provider', 'oauth_id'],
        unique=True, postgresql_where=sa.text('oauth_provider IS NOT NULL')
    )


def downgrade() -> None:
    op.drop_index('ix_users_oauth_provider_id', table_name='users')
    op.drop_column('users', 'oauth_id')
    op.drop_column('users', 'oauth_provider')
