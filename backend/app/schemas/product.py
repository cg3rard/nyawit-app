from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    """Schema for creating a new product. All business-required fields are mandatory."""

    product_code: str = Field(
        ..., min_length=1, max_length=50, description="Unique product identifier"
    )
    name: str = Field(..., min_length=1, max_length=100, description="Product name")
    category: str = Field(..., min_length=1, max_length=100, description="Product category")
    purchase_price: Decimal = Field(
        ..., ge=0, decimal_places=2, description="Purchase/cost price"
    )
    selling_price: Decimal = Field(
        ..., ge=0, decimal_places=2, description="Retail selling price"
    )
    stock: int = Field(default=0, ge=0, description="Current stock quantity")
    expiry_date: Optional[date] = Field(default=None, description="Expiry date (optional)")


class ProductUpdate(BaseModel):
    """Schema for updating a product. All fields are optional — only provided fields are changed."""

    product_code: Optional[str] = Field(default=None, min_length=1, max_length=50)
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    purchase_price: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    selling_price: Optional[Decimal] = Field(default=None, ge=0, decimal_places=2)
    expiry_date: Optional[date] = Field(default=None)


class ProductRead(BaseModel):
    """Schema returned to the client. Includes all fields including id."""

    id: int
    product_code: str
    name: str
    category: Optional[str]
    purchase_price: Decimal
    selling_price: Decimal
    stock: int
    expiry_date: Optional[date]

    model_config = ConfigDict(from_attributes=True)
