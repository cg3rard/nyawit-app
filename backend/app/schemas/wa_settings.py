from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.supplier import SupplierReadSimple

class WASettingsRead(BaseModel):
    id: int
    bot_name: str
    phone_number: str
    status: str
    qr_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class WASettingsUpdate(BaseModel):
    bot_name: Optional[str] = None
    phone_number: Optional[str] = None
    status: Optional[str] = None
    qr_code: Optional[str] = None

class RestockResultSimple(BaseModel):
    """Embedded in WAMessageRead — shows the live status of the linked restock order."""
    id: str
    status: str
    supplier_note: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    received_quantity: Optional[int] = None
    received_expiry_date: Optional[date] = None
    received_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class WAMessageRead(BaseModel):
    id: int
    supplier_id: Optional[int] = None
    supplier: Optional[SupplierReadSimple] = None
    restock_order_id: Optional[str] = None
    restock_order: Optional[RestockResultSimple] = None
    phone_number: str
    message: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProductSimpleForRestock(BaseModel):
    id: int
    product_code: str
    name: str
    category: Optional[str] = None
    purchase_price: float
    selling_price: float
    stock: int

    model_config = ConfigDict(from_attributes=True)

class RestockOrderRead(BaseModel):
    id: str
    product_id: int
    product: ProductSimpleForRestock
    supplier_id: Optional[int] = None
    supplier: Optional[SupplierReadSimple] = None
    quantity: int
    status: str
    token: str
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    supplier_note: Optional[str] = None
    received_quantity: Optional[int] = None
    received_expiry_date: Optional[date] = None
    received_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class RestockOrderCreate(BaseModel):
    product_id: int = Field(..., description="ID of the product to restock")
    quantity: int = Field(..., ge=1, description="Quantity to request")

class RestockConfirmationPayload(BaseModel):
    confirm: bool = Field(..., description="Whether the supplier confirms sending the restock")
    quantity: int = Field(..., ge=0, description="Quantity being sent")
    reason: Optional[str] = Field(default=None, max_length=255, description="Supplier note or reason")

class ReceiveRestockPayload(BaseModel):
    received_quantity: int = Field(..., ge=1, description="Quantity actually received by the store")
    received_expiry_date: Optional[date] = Field(default=None, description="Expiry date of the received goods")
