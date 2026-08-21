from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Supplier name")
    whatsapp: str = Field(..., min_length=1, max_length=20, description="WhatsApp phone number")


class SupplierCreate(SupplierBase):
    product_ids: Optional[List[int]] = Field(default=[], description="IDs of products to assign to this supplier")


class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    whatsapp: Optional[str] = Field(default=None, min_length=1, max_length=20)
    product_ids: Optional[List[int]] = Field(default=None, description="IDs of products to assign to this supplier")


class ProductSimple(BaseModel):
    id: int
    product_code: str
    name: str
    stock: int

    model_config = ConfigDict(from_attributes=True)


class SupplierRead(SupplierBase):
    id: int
    products: List[ProductSimple] = []

    model_config = ConfigDict(from_attributes=True)


class SupplierReadSimple(SupplierBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
