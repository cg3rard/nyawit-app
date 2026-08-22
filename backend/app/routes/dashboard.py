from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.dashboard import DashboardSummary
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Owner Dashboard summary.

    Returns a single read-only payload containing:
    - sales_today       — revenue, transactions, items sold (current calendar date)
    - top_products      — best sellers by quantity (today)
    - revenue_by_product — revenue from TransactionItem.subtotal (today)
    - inventory         — total products, stock units, low/out-of-stock counts
    - low_stock_products — products at or below threshold=5
    - expiry_alerts     — products expiring within 7 days (or already expired)

    READ-ONLY — never modifies Product.stock, StockMovements, Transactions,
    TransactionItems, or any other record.
    """
    return dashboard_service.get_dashboard_summary(db)
