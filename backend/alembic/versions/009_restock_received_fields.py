"""Add received_quantity and received_expiry_date to restock_orders

Revision ID: 009_restock_received_fields
Revises: 008_wa_message_restock_order_fk
Create Date: 2026-08-21
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009_restock_received_fields"
down_revision: Union[str, None] = "008_wa_message_restock_order_fk"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column("restock_orders", sa.Column("received_quantity", sa.Integer(), nullable=True))
    op.add_column("restock_orders", sa.Column("received_expiry_date", sa.Date(), nullable=True))
    op.add_column("restock_orders", sa.Column("received_at", sa.DateTime(), nullable=True))

def downgrade() -> None:
    op.drop_column("restock_orders", "received_at")
    op.drop_column("restock_orders", "received_expiry_date")
    op.drop_column("restock_orders", "received_quantity")
