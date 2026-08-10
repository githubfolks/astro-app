"""merge oauth and translation cache heads

Revision ID: c3a75f318dda
Revises: 5cb17f27b82a, fb996b4b40b9
Create Date: 2026-08-10 15:27:24.254992

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3a75f318dda'
down_revision: Union[str, Sequence[str], None] = ('5cb17f27b82a', 'fb996b4b40b9')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
