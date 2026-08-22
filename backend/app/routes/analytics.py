from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analytics import (
    InventorySummary,
    LowStockProduct,
    RevenueByProduct,
    TopProduct,
)
from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/top-products", response_model=List[TopProduct])
def top_products(
    limit: int = Query(default=5, ge=1, le=100, description="Max products to return"),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Best-selling products by total quantity sold (SQL aggregation).
    READ-ONLY — does not modify any data.
    """
    return analytics_service.get_top_products(
        db, limit=limit, start_date=start_date, end_date=end_date
    )

@router.get("/revenue-by-product", response_model=List[RevenueByProduct])
def revenue_by_product(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
):
    """
    Revenue per product from TransactionItem.subtotal (historical price snapshot).
    READ-ONLY — does not modify any data.
    """
    return analytics_service.get_revenue_by_product(
        db, start_date=start_date, end_date=end_date
    )

@router.get("/low-stock", response_model=List[LowStockProduct])
def low_stock(
    threshold: int = Query(default=5, ge=0, description="Stock level considered low"),
    db: Session = Depends(get_db),
):
    """
    Products whose current stock is at or below the threshold.
    READ-ONLY — does not modify Product.stock or create StockMovement records.
    """
    return analytics_service.get_low_stock(db, threshold=threshold)

@router.get("/inventory-summary", response_model=InventorySummary)
def inventory_summary(
    db: Session = Depends(get_db),
):
    """
    Aggregated inventory snapshot: product count, total units, low-stock and
    out-of-stock counts. READ-ONLY.
    """
    return analytics_service.get_inventory_summary(db)
