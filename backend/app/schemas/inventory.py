from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.stock_movement import MovementType


class StockInRequest(BaseModel):
    """Request body for receiving stock (Stock IN)."""
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0, description="Units to add (must be > 0)")
    reason: Optional[str] = Field(default=None, max_length=255)


class StockOutRequest(BaseModel):
    """Request body for dispensing stock (Stock OUT)."""
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0, description="Units to remove (must be > 0)")
    reason: Optional[str] = Field(default=None, max_length=255)


class StockAdjustmentRequest(BaseModel):
    """
    Request body for stock correction.

    Uses `new_stock` (absolute target value) rather than a signed delta to
    avoid ambiguity about the direction of change.
    """
    product_id: int = Field(..., gt=0)
    new_stock: int = Field(..., ge=0, description="Target stock level after adjustment")
    reason: Optional[str] = Field(default=None, max_length=255)


class StockMovementRead(BaseModel):
    """Response schema for a stock movement record."""
    id: int
    product_id: int
    movement_type: MovementType
    quantity: int
    stock_before: int
    stock_after: int
    reason: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
