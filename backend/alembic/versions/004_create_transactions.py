"""Create transactions and transaction_items tables

Revision ID: 004_create_transactions
Revises: 003_create_stock_movements_table
Create Date: 2026-08-18

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_create_transactions"
down_revision: Union[str, None] = "003_create_stock_movements_table"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("transaction_code", sa.String(length=50), nullable=False),
        sa.Column("total_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transactions_id", "transactions", ["id"], unique=False)
    op.create_index("ix_transactions_transaction_code", "transactions", ["transaction_code"], unique=True)

    op.create_table(
        "transaction_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("transaction_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("subtotal", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transaction_items_id", "transaction_items", ["id"], unique=False)
    op.create_index("ix_transaction_items_transaction_id", "transaction_items", ["transaction_id"], unique=False)
    op.create_index("ix_transaction_items_product_id", "transaction_items", ["product_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_transaction_items_product_id", table_name="transaction_items")
    op.drop_index("ix_transaction_items_transaction_id", table_name="transaction_items")
    op.drop_index("ix_transaction_items_id", table_name="transaction_items")
    op.drop_table("transaction_items")

    op.drop_index("ix_transactions_transaction_code", table_name="transactions")
    op.drop_index("ix_transactions_id", table_name="transactions")
    op.drop_table("transactions")
