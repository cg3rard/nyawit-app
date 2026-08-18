"""Update products table: replace price with purchase_price + selling_price, add product_code, category, expiry_date

Revision ID: 002_update_products_schema
Revises: 001_initial
Create Date: 2026-08-18

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002_update_products_schema"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Expand the products table for the CoStore MVP:
      - Add product_code (unique, varchar 50)
      - Add category (varchar 100, nullable)
      - Add purchase_price (Numeric 10,2)
      - Add selling_price  (Numeric 10,2)
      - Add expiry_date    (Date, nullable)
      - Drop the old generic price column
    """
    op.add_column(
        "products",
        sa.Column("product_code", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("category", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("purchase_price", sa.Numeric(precision=10, scale=2), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("selling_price", sa.Numeric(precision=10, scale=2), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column("expiry_date", sa.Date(), nullable=True),
    )
    op.create_index(
        "ix_products_product_code", "products", ["product_code"], unique=True
    )
    op.drop_column("products", "price")


def downgrade() -> None:
    """Reverse: restore price column, remove new fields."""
    op.add_column(
        "products",
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=True),
    )
    op.drop_index("ix_products_product_code", table_name="products")
    op.drop_column("products", "expiry_date")
    op.drop_column("products", "selling_price")
    op.drop_column("products", "purchase_price")
    op.drop_column("products", "category")
    op.drop_column("products", "product_code")
