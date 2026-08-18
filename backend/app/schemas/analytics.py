from decimal import Decimal

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


class InventorySummary(BaseModel):
    total_products: int
    total_stock_units: int
    out_of_stock_products: int
    low_stock_products: int
