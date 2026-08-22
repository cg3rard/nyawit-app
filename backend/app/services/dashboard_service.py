from datetime import date, datetime, time
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.transaction import Transaction, TransactionItem
from app.schemas.dashboard import DashboardSummary, ExpiryAlert, SalesToday, AIInsightDetail
from app.services.analytics_service import (
    get_inventory_summary,
    get_low_stock,
    get_revenue_by_product,
    get_top_products,
)

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

    trx_row = (
        db.query(
            func.coalesce(func.sum(Transaction.total_amount), 0).label("total_revenue"),
            func.count(Transaction.id).label("total_transactions"),
        )
        .filter(Transaction.created_at >= start_dt)
        .filter(Transaction.created_at <= end_dt)
        .one()
    )

    items_row = (
        db.query(
            func.coalesce(func.sum(TransactionItem.quantity), 0).label("total_items_sold"),
            func.coalesce(
                func.sum(TransactionItem.quantity * Product.purchase_price), 0
            ).label("total_cogs"),
        )
        .join(Transaction, Transaction.id == TransactionItem.transaction_id)
        .join(Product, Product.id == TransactionItem.product_id)
        .filter(Transaction.created_at >= start_dt)
        .filter(Transaction.created_at <= end_dt)
        .one()
    )

    revenue = Decimal(str(trx_row.total_revenue))
    cogs = Decimal(str(items_row.total_cogs))
    net_income = revenue - cogs

    return SalesToday(
        total_revenue=revenue,
        total_transactions=int(trx_row.total_transactions),
        total_items_sold=int(items_row.total_items_sold),
        total_net_income=net_income,
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

def _get_ai_insight(db: Session) -> Optional[AIInsightDetail]:
    from datetime import timedelta
    from engine.metrics import InventoryEngine
    from app.routes.ai import get_llm_recommendation
    
    products = db.query(Product).all()
    if not products:
        return None
        
    today = date.today()
    start_date = today - timedelta(days=13)
    
    sales_data = (
        db.query(
            TransactionItem.product_id,
            func.date(Transaction.created_at).label("sale_date"),
            func.sum(TransactionItem.quantity).label("total_qty")
        )
        .join(Transaction, Transaction.id == TransactionItem.transaction_id)
        .filter(Transaction.created_at >= datetime.combine(start_date, time.min))
        .group_by(TransactionItem.product_id, func.date(Transaction.created_at))
        .all()
    )
    
    product_sales = {}
    for row in sales_data:
        p_id = row.product_id
        d = row.sale_date
        if isinstance(d, str):
            d_str = d
        elif d is not None:
            d_str = d.strftime("%Y-%m-%d")
        else:
            continue
            
        if p_id not in product_sales:
            product_sales[p_id] = {}
        product_sales[p_id][d_str] = int(row.total_qty)
        
    dates = [today - timedelta(days=i) for i in range(13, -1, -1)]
    critical_items = []
    
    for p in products:
        sales_map = product_sales.get(p.id, {})
        history = []
        for d in dates:
            d_str = d.strftime("%Y-%m-%d")
            history.append(sales_map.get(d_str, 0))
            
        prior_7d = history[:7]
        recent_7d = history[7:]
        
        metrics = InventoryEngine.calculate_metrics(
            product_name=p.name,
            current_stock=p.stock,
            sales_recent_7d=recent_7d,
            sales_prior_7d=prior_7d
        )
        
        if metrics.status in ("Merah", "Kuning"):
            critical_items.append((p.id, p.name, metrics))
            
    if not critical_items:
        return None
        
    def sort_key(item):
        _, _, m = item
        status_val = 0 if m.status == "Merah" else 1
        metric_val = m.days_of_inventory if m.status == "Merah" else -m.current_stock
        return (status_val, metric_val)
        
    critical_items.sort(key=sort_key)
    
    p_id, p_name, m = critical_items[0]
    ai_rec = get_llm_recommendation(m.prompt_payload, m.status)
    
    return AIInsightDetail(
        product_id=p_id,
        product_name=p_name,
        status=m.status,
        metrics={
            "current_stock": m.current_stock,
            "sma_7_daily": m.sma_7,
            "sma_prior_daily": m.sma_prior,
            "sales_trend_pct": f"{m.trend_pct:+}%",
            "days_of_inventory": m.days_of_inventory
        },
        ai_recommendation=ai_rec
    )

def get_dashboard_summary(db: Session) -> DashboardSummary:
    """
    Build the full Owner Dashboard payload.

    Calls existing analytics service functions (no logic duplication).
    All data is sourced from SELECT-only queries.
    Nothing is written to the database.
    """
    LOW_STOCK_THRESHOLD = 5
    TOP_PRODUCTS_LIMIT = 5
    from app.schemas.dashboard import AIInsightDetail

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
        ai_insight=_get_ai_insight(db),
    )
