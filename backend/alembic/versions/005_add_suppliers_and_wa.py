"""Add suppliers and wa tables

Revision ID: 005_add_suppliers_and_wa
Revises: 004_create_transactions
Create Date: 2026-08-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005_add_suppliers_and_wa"
down_revision: Union[str, None] = "004_create_transactions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create suppliers table
    op.create_table(
        "suppliers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("whatsapp", sa.String(length=20), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_suppliers_id", "suppliers", ["id"], unique=False)

    # 2. Add supplier_id to products
    op.add_column(
        "products",
        sa.Column("supplier_id", sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        "fk_products_supplier_id",
        "products",
        "suppliers",
        ["supplier_id"],
        ["id"],
        ondelete="SET NULL"
    )
    op.create_index("ix_products_supplier_id", "products", ["supplier_id"], unique=False)

    # 3. Create wa_settings table
    op.create_table(
        "wa_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("bot_name", sa.String(length=100), nullable=False),
        sa.Column("phone_number", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("qr_code", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_wa_settings_id", "wa_settings", ["id"], unique=False)

    # Seed default WA Settings row (id=1)
    op.execute(
        "INSERT INTO wa_settings (id, bot_name, phone_number, status, qr_code) "
        "VALUES (1, 'CoStore Bot', '+628123456789', 'DISCONNECTED', 'MOCK_QR_CODE_DATA')"
    )

    # 4. Create restock_orders table
    op.create_table(
        "restock_orders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("supplier_id", sa.Integer(), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("confirmed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index("ix_restock_orders_id", "restock_orders", ["id"], unique=False)

    # 5. Create wa_messages table
    op.create_table(
        "wa_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("supplier_id", sa.Integer(), nullable=True),
        sa.Column("phone_number", sa.String(length=20), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_wa_messages_id", "wa_messages", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_wa_messages_id", table_name="wa_messages")
    op.drop_table("wa_messages")

    op.drop_index("ix_restock_orders_id", table_name="restock_orders")
    op.drop_table("restock_orders")

    op.drop_index("ix_wa_settings_id", table_name="wa_settings")
    op.drop_table("wa_settings")

    op.drop_index("ix_products_supplier_id", table_name="products")
    op.drop_constraint("fk_products_supplier_id", "products", type_="foreignkey")
    op.drop_column("products", "supplier_id")

    op.drop_index("ix_suppliers_id", table_name="suppliers")
    op.drop_table("suppliers")
