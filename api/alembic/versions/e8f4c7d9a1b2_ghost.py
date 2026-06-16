"""ghost revision

Revision ID: e8f4c7d9a1b2
Revises: a0efd672a243
Create Date: 2026-02-01 23:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e8f4c7d9a1b2'
down_revision: Union[str, Sequence[str], None] = 'a0efd672a243'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass
