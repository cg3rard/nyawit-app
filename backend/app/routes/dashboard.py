from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.dashboard import DashboardSummary
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    low_stock_threshold: int = 5,
    db: Session = Depends(get_db),
):
    return dashboard_service.get_dashboard_summary(db, low_stock_threshold=low_stock_threshold)
