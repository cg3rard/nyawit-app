"""Add supplier_note to restock_orders

Revision ID: 006_add_supplier_note
Revises: 005_add_suppliers_and_wa
Create Date: 2026-08-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006_add_supplier_note"
down_revision: Union[str, None] = "005_add_suppliers_and_wa"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "restock_orders",
        sa.Column("supplier_note", sa.String(length=255), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("restock_orders", "supplier_note")
