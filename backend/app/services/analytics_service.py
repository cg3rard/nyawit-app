from datetime import date, datetime, time
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.transaction import Transaction, TransactionItem
from app.schemas.analytics import (
    InventorySummary,
    LowStockProduct,
    RevenueByProduct,
    TopProduct,
)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _apply_date_filter(q, start_date: Optional[date], end_date: Optional[date]):
    """
    Filter a query on Transaction.created_at.
    end_date is inclusive — filters up to 23:59:59 of that day.
    """
    if start_date is not None:
        q = q.filter(Transaction.created_at >= datetime.combine(start_date, time.min))
    if end_date is not None:
        q = q.filter(Transaction.created_at <= datetime.combine(end_date, time.max))
    return q


# ---------------------------------------------------------------------------
# Analytics queries — all SELECT, zero writes
# ---------------------------------------------------------------------------

def get_top_products(
    db: Session,
    limit: int = 5,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[TopProduct]:
    """
    Return best-selling products ordered by total quantity sold descending.
    Uses a single SQL aggregation join — no Python-side accumulation.
    """
    q = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.sum(TransactionItem.quantity).label("total_quantity_sold"),
        )
        .join(TransactionItem, TransactionItem.product_id == Product.id)
        .join(Transaction, Transaction.id == TransactionItem.transaction_id)
    )

    q = _apply_date_filter(q, start_date, end_date)

    rows = (
        q.group_by(Product.id, Product.name)
        .order_by(func.sum(TransactionItem.quantity).desc())
        .limit(limit)
        .all()
    )

    return [
        TopProduct(
            product_id=row.product_id,
            product_name=row.product_name,
            total_quantity_sold=int(row.total_quantity_sold),
        )
        for row in rows
    ]


def get_revenue_by_product(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[RevenueByProduct]:
    """
    Return revenue per product ordered by total_revenue descending.
    Revenue is sourced from TransactionItem.subtotal (historical sale price snapshot).
    """
    q = (
        db.query(
            Product.id.label("product_id"),
            Product.name.label("product_name"),
            func.sum(TransactionItem.subtotal).label("total_revenue"),
        )
        .join(TransactionItem, TransactionItem.product_id == Product.id)
        .join(Transaction, Transaction.id == TransactionItem.transaction_id)
    )

    q = _apply_date_filter(q, start_date, end_date)

    rows = (
        q.group_by(Product.id, Product.name)
        .order_by(func.sum(TransactionItem.subtotal).desc())
        .all()
    )

    return [
        RevenueByProduct(
            product_id=row.product_id,
            product_name=row.product_name,
            total_revenue=Decimal(str(row.total_revenue)),
        )
        for row in rows
    ]


def get_low_stock(db: Session, threshold: int = 5) -> List[LowStockProduct]:
    """
    Return products whose current stock is <= threshold, ordered by stock ascending.
    READ-ONLY — never writes to Product.stock or StockMovement.
    """
    rows = (
        db.query(Product)
        .options(joinedload(Product.supplier))
        .filter(Product.stock <= threshold)
        .order_by(Product.stock.asc())
        .all()
    )

    return [
        LowStockProduct(
            product_id=p.id,
            product_code=p.product_code,
            product_name=p.name,
            stock=p.stock,
            threshold=threshold,
            supplier_id=p.supplier_id,
            supplier_name=p.supplier.name if p.supplier else None,
        )
        for p in rows
    ]


def get_inventory_summary(db: Session, low_stock_threshold: int = 5) -> InventorySummary:
    """
    Return aggregated current inventory counts.
    All values sourced from Product.stock — single query with conditional aggregation.
    """
    from sqlalchemy import case

    row = db.query(
        func.count(Product.id).label("total_products"),
        func.coalesce(func.sum(Product.stock), 0).label("total_stock_units"),
        func.sum(
            case((Product.stock <= 0, 1), else_=0)
        ).label("out_of_stock_products"),
        func.sum(
            case((Product.stock <= low_stock_threshold, 1), else_=0)
        ).label("low_stock_products"),
    ).one()

    return InventorySummary(
        total_products=int(row.total_products),
        total_stock_units=int(row.total_stock_units),
        out_of_stock_products=int(row.out_of_stock_products or 0),
        low_stock_products=int(row.low_stock_products or 0),
    )
