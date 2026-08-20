from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.stock_movement import MovementType


class StockInRequest(BaseModel):
    """Request body for receiving stock."""

    product_id: int = Field(..., gt=0)
    quantity: int = Field(
        ...,
        gt=0,
        description="Units to add (must be > 0)",
    )
    reason: Optional[str] = Field(
        default=None,
        max_length=255,
    )


class StockOutRequest(BaseModel):
    """Request body for dispensing stock."""

    product_id: int = Field(..., gt=0)
    quantity: int = Field(
        ...,
        gt=0,
        description="Units to remove (must be > 0)",
    )
    reason: Optional[str] = Field(
        default=None,
        max_length=255,
    )


class StockAdjustmentRequest(BaseModel):
    """Request body for stock correction."""

    product_id: int = Field(..., gt=0)

    new_stock: int = Field(
        ...,
        ge=0,
        description="Target stock level after adjustment",
    )

    reason: Optional[str] = Field(
        default=None,
        max_length=255,
    )


class ProductMovementInfo(BaseModel):
    """Minimal product information returned with a movement."""

    id: int
    product_code: str
    name: str

    model_config = ConfigDict(from_attributes=True)


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

    product: Optional[ProductMovementInfo] = None

    model_config = ConfigDict(from_attributes=True)
