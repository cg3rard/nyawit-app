from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class TopProduct(BaseModel):
    product_id: int
    product_name: str
    total_quantity_sold: int


class RevenueByProduct(BaseModel):
    product_id: int
    product_name: str
    total_revenue: Decimal


class LowStockProduct(BaseModel):
    product_id: int
    product_code: str
    product_name: str
    stock: int
    threshold: int
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None


class InventorySummary(BaseModel):
    total_products: int
    total_stock_units: int
    out_of_stock_products: int
    low_stock_products: int
