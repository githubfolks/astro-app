"""add_slug_to_astrologer_profiles

Revision ID: f3a8c1d2e9b4
Revises: eba4cfe36c0b
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import re
import unicodedata

revision: str = 'f3a8c1d2e9b4'
down_revision: Union[str, Sequence[str], None] = 'eba4cfe36c0b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-') or 'astrologer'


def upgrade() -> None:
    # 1. Add slug column as nullable first
    op.add_column('astrologer_profiles', sa.Column('slug', sa.String(), nullable=True))

    # 2. Backfill existing rows with unique slugs
    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT user_id, full_name FROM astrologer_profiles ORDER BY user_id")).fetchall()

    used_slugs: set[str] = set()
    for user_id, full_name in rows:
        base = _slugify(full_name or 'astrologer')
        slug = base if base not in used_slugs else f"{base}-{user_id}"
        used_slugs.add(slug)
        bind.execute(
            sa.text("UPDATE astrologer_profiles SET slug = :slug WHERE user_id = :uid"),
            {"slug": slug, "uid": user_id}
        )

    # 3. Add unique index (column stays nullable for safety)
    op.create_index('ix_astrologer_profiles_slug', 'astrologer_profiles', ['slug'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_astrologer_profiles_slug', table_name='astrologer_profiles')
    op.drop_column('astrologer_profiles', 'slug')
