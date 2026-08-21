"""Add restock_order_id FK to wa_messages

Revision ID: 008_wa_message_restock_order_fk
Revises: 007_restock_order_uuid_id
Create Date: 2026-08-21
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "008_wa_message_restock_order_fk"
down_revision: Union[str, None] = "007_restock_order_uuid_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "wa_messages",
        sa.Column(
            "restock_order_id",
            sa.CHAR(36),
            sa.ForeignKey("restock_orders.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("wa_messages", "restock_order_id")
