from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.stock_movement import MovementType
from app.schemas.inventory import (
    StockAdjustmentRequest,
    StockInRequest,
    StockMovementRead,
    StockOutRequest,
)
from app.services import inventory_service

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.post("/in", response_model=StockMovementRead, status_code=status.HTTP_201_CREATED)
def receive_stock(data: StockInRequest, db: Session = Depends(get_db)):
    """Add stock to a product (Stock IN)."""
    movement = inventory_service.stock_in(db, data)
    if movement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return movement


@router.post("/out", response_model=StockMovementRead, status_code=status.HTTP_201_CREATED)
def dispense_stock(data: StockOutRequest, db: Session = Depends(get_db)):
    """Remove stock from a product (Stock OUT). Returns 400 if stock is insufficient."""
    try:
        movement = inventory_service.stock_out(db, data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if movement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return movement


@router.post("/adjustment", response_model=StockMovementRead, status_code=status.HTTP_201_CREATED)
def adjust_stock(data: StockAdjustmentRequest, db: Session = Depends(get_db)):
    """
    Set product stock to an absolute value (Stock ADJUSTMENT).

    The `new_stock` field is the desired stock level after correction.
    """
    movement = inventory_service.stock_adjustment(db, data)
    if movement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return movement


@router.get("/movements", response_model=List[StockMovementRead])
def list_movements(
    product_id: Optional[int] = None,
    movement_type: Optional[MovementType] = None,
    db: Session = Depends(get_db),
):
    """Return stock movement history, newest first. Filterable by product_id and movement_type."""
    return inventory_service.get_movements(db, product_id=product_id, movement_type=movement_type)
