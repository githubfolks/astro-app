"""add_voice_gender

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-10 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

voice_gender_enum = postgresql.ENUM('MALE', 'FEMALE', name='voicegender', create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE voicegender AS ENUM ('MALE', 'FEMALE');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """))
    op.add_column(
        'content_studio_jobs',
        sa.Column('voice_gender', voice_gender_enum, nullable=False, server_default='FEMALE'),
    )


def downgrade() -> None:
    op.drop_column('content_studio_jobs', 'voice_gender')
    bind = op.get_bind()
    bind.execute(sa.text("DROP TYPE IF EXISTS voicegender"))
