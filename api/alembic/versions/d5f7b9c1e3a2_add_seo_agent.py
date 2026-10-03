"""add SEO Agent keyword queue and agent fields on posts

Revision ID: d5f7b9c1e3a2
Revises: c4e8a2d6f1b3
Create Date: 2026-10-03 00:00:00.000000

seo_keywords is the admin-curated topic queue the SEO Agent drafts from.
posts gains generated_by (existing rows backfill to "manual"), agent_meta
(keyword/model/usage/quality report for agent drafts) and reviewed_by /
reviewed_at (who published an agent draft). Additive only.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd5f7b9c1e3a2'
down_revision: Union[str, Sequence[str], None] = 'c4e8a2d6f1b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('posts', sa.Column('generated_by', sa.String(20), nullable=False, server_default='manual'))
    op.add_column('posts', sa.Column('agent_meta', sa.JSON(), nullable=True))
    op.add_column('posts', sa.Column('reviewed_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True))
    op.add_column('posts', sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        'seo_keywords',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('keyword', sa.String(200), nullable=False),
        sa.Column('source', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('gsc_impressions', sa.Integer(), nullable=True),
        sa.Column('gsc_clicks', sa.Integer(), nullable=True),
        sa.Column('gsc_position', sa.DECIMAL(6, 2), nullable=True),
        sa.Column('gsc_page', sa.String(), nullable=True),
        sa.Column('gsc_captured_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('post_id', sa.Integer(), sa.ForeignKey('posts.id', ondelete='SET NULL'), nullable=True),
        sa.Column('last_error', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_seo_keywords_id', 'seo_keywords', ['id'])
    op.create_index('ix_seo_keywords_keyword', 'seo_keywords', ['keyword'], unique=True)
    op.create_index('ix_seo_keywords_status', 'seo_keywords', ['status'])


def downgrade() -> None:
    op.drop_index('ix_seo_keywords_status', table_name='seo_keywords')
    op.drop_index('ix_seo_keywords_keyword', table_name='seo_keywords')
    op.drop_index('ix_seo_keywords_id', table_name='seo_keywords')
    op.drop_table('seo_keywords')
    op.drop_column('posts', 'reviewed_at')
    op.drop_column('posts', 'reviewed_by')
    op.drop_column('posts', 'agent_meta')
    op.drop_column('posts', 'generated_by')
