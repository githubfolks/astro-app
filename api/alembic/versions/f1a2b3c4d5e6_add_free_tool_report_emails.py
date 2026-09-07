"""add free_tool_report_emails

Revision ID: f1a2b3c4d5e6
Revises: 9a7c4e2b1f08
Create Date: 2026-09-08 00:00:00.000000

Audit log for guest emails captured on the free Kundli chart / Kundli match
tools when a visitor asks to have their PDF report emailed to them. See
FreeToolReportEmail in models.py.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = '9a7c4e2b1f08'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'free_tool_report_emails',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('tool_type', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_free_tool_report_emails_email', 'free_tool_report_emails', ['email'])


def downgrade() -> None:
    op.drop_index('ix_free_tool_report_emails_email', table_name='free_tool_report_emails')
    op.drop_table('free_tool_report_emails')
