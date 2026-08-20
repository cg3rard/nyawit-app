from datetime import date
from decimal import Decimal
from typing import List

from pydantic import BaseModel

from app.schemas.analytics import (
    InventorySummary,
    LowStockProduct,
    RevenueByProduct,
    TopProduct,
)


class SalesToday(BaseModel):
    """Today's sales totals — transactions created on the current calendar date."""
    total_revenue: Decimal
    total_transactions: int
    total_items_sold: int
    total_net_income: Decimal


class ExpiryAlert(BaseModel):
    """Product whose expiry_date is today or in the past, or within an upcoming window."""
    product_id: int
    product_code: str
    product_name: str
    expiry_date: date


class DashboardSummary(BaseModel):
    """
    Single aggregated payload for the CoStore Owner Dashboard.

    All values are read-only aggregations — nothing is written to the DB.
    """
    sales_today: SalesToday
    top_products: List[TopProduct]
    revenue_by_product: List[RevenueByProduct]
    inventory: InventorySummary
    low_stock_products: List[LowStockProduct]
    expiry_alerts: List[ExpiryAlert]
