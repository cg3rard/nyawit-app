from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

class TransactionItemRequest(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0, description="Units to purchase (must be > 0)")

class TransactionCreate(BaseModel):
    items: List[TransactionItemRequest] = Field(..., min_length=1)

class TransactionItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)

class TransactionRead(BaseModel):
    id: int
    transaction_code: str
    total_amount: Decimal
    created_at: datetime
    items: List[TransactionItemRead]

    model_config = ConfigDict(from_attributes=True)

class SalesSummary(BaseModel):
    """Read-only aggregated sales summary."""
    total_transactions: int
    total_revenue: Decimal
    total_items_sold: int
