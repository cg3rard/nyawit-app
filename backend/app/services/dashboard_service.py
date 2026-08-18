from datetime import date, datetime, time
from decimal import Decimal
from typing import List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.transaction import Transaction, TransactionItem
from app.schemas.dashboard import DashboardSummary, ExpiryAlert, SalesToday
from app.services.analytics_service import (
    get_inventory_summary,
    get_low_stock,
    get_revenue_by_product,
    get_top_products,
)

# Days ahead to include in expiry alerts (products expiring within this window)
EXPIRY_ALERT_DAYS_AHEAD = 7


def _get_sales_today(db: Session) -> SalesToday:
    """
    Aggregate transaction totals for the current calendar date only.
    Uses Transaction.created_at bounded to [today 00:00:00, today 23:59:59].
    Pure SELECT — no writes.
    """
    today = date.today()
    start_dt = datetime.combine(today, time.min)
    end_dt = datetime.combine(today, time.max)

    row = (
        db.query(
            func.coalesce(func.sum(Transaction.total_amount), 0).label("total_revenue"),
            func.count(func.distinct(Transaction.id)).label("total_transactions"),
            func.coalesce(
                func.sum(TransactionItem.quantity), 0
            ).label("total_items_sold"),
        )
        .outerjoin(TransactionItem, TransactionItem.transaction_id == Transaction.id)
        .filter(Transaction.created_at >= start_dt)
        .filter(Transaction.created_at <= end_dt)
        .one()
    )

    return SalesToday(
        total_revenue=Decimal(str(row.total_revenue)),
        total_transactions=int(row.total_transactions),
        total_items_sold=int(row.total_items_sold),
    )


def _get_expiry_alerts(db: Session) -> List[ExpiryAlert]:
    """
    Return products whose expiry_date is:
      - already expired (expiry_date < today), OR
      - expiring within EXPIRY_ALERT_DAYS_AHEAD days from today.

    Ordered by expiry_date ascending (most urgent first).
    Only includes products where expiry_date IS NOT NULL.
    Pure SELECT — no writes.
    """
    from datetime import timedelta

    today = date.today()
    alert_cutoff = today + timedelta(days=EXPIRY_ALERT_DAYS_AHEAD)

    rows = (
        db.query(Product)
        .filter(Product.expiry_date.isnot(None))
        .filter(Product.expiry_date <= alert_cutoff)
        .order_by(Product.expiry_date.asc())
        .all()
    )

    return [
        ExpiryAlert(
            product_id=p.id,
            product_code=p.product_code,
            product_name=p.name,
            expiry_date=p.expiry_date,
        )
        for p in rows
    ]


def get_dashboard_summary(db: Session) -> DashboardSummary:
    """
    Build the full Owner Dashboard payload.

    Calls existing analytics service functions (no logic duplication).
    All data is sourced from SELECT-only queries.
    Nothing is written to the database.
    """
    LOW_STOCK_THRESHOLD = 5
    TOP_PRODUCTS_LIMIT = 5

    return DashboardSummary(
        sales_today=_get_sales_today(db),
        top_products=get_top_products(
            db,
            limit=TOP_PRODUCTS_LIMIT,
            start_date=date.today(),
            end_date=date.today(),
        ),
        revenue_by_product=get_revenue_by_product(
            db,
            start_date=date.today(),
            end_date=date.today(),
        ),
        inventory=get_inventory_summary(db, low_stock_threshold=LOW_STOCK_THRESHOLD),
        low_stock_products=get_low_stock(db, threshold=LOW_STOCK_THRESHOLD),
        expiry_alerts=_get_expiry_alerts(db),
    )
