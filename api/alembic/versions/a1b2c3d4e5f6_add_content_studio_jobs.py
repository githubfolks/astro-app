"""add_content_studio_jobs

Revision ID: a1b2c3d4e5f6
Revises: cee32ee05821
Create Date: 2026-07-09 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'cee32ee05821'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# postgresql.ENUM (not generic sa.Enum) actually honors create_type=False —
# the types are created explicitly via the DO blocks below, so table creation
# must not also try to auto-create them.
content_type_enum = postgresql.ENUM('SHORT_VIDEO', 'VOICE_OVER_IMAGE', name='contenttype', create_type=False)
content_job_status_enum = postgresql.ENUM('SCENES_GENERATED', 'RENDERING', 'DONE', 'FAILED', name='contentjobstatus', create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    # DO-block idiom: Postgres has no CREATE TYPE IF NOT EXISTS, and this dev
    # DB has shown a checkfirst race where the type already exists by the time
    # CREATE TYPE runs, so swallow duplicate_object explicitly instead.
    bind.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE contenttype AS ENUM ('SHORT_VIDEO', 'VOICE_OVER_IMAGE');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """))
    bind.execute(sa.text("""
        DO $$ BEGIN
            CREATE TYPE contentjobstatus AS ENUM ('SCENES_GENERATED', 'RENDERING', 'DONE', 'FAILED');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """))

    op.create_table(
        'content_studio_jobs',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('topic', sa.String(), nullable=False),
        sa.Column('content_type', content_type_enum, nullable=False),
        sa.Column('status', content_job_status_enum, nullable=False, server_default='SCENES_GENERATED'),
        sa.Column('scenes', sa.JSON(), nullable=False),
        sa.Column('output_video_url', sa.String(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()')),
    )


def downgrade() -> None:
    op.drop_table('content_studio_jobs')
    bind = op.get_bind()
    bind.execute(sa.text("DROP TYPE IF EXISTS contentjobstatus"))
    bind.execute(sa.text("DROP TYPE IF EXISTS contenttype"))
