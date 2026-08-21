from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.supplier import SupplierCreate, SupplierRead, SupplierUpdate
from app.services import supplier_service

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


@router.get("/", response_model=List[SupplierRead])
def list_suppliers(db: Session = Depends(get_db)):
    """Return all suppliers ordered by id ascending."""
    return supplier_service.get_suppliers(db)


@router.get("/{supplier_id}", response_model=SupplierRead)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Return a single supplier by id. Returns 404 if not found."""
    supplier = supplier_service.get_supplier_by_id(db, supplier_id)
    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )
    return supplier


@router.post("/", response_model=SupplierRead, status_code=status.HTTP_201_CREATED)
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db)):
    """Create a new supplier and assign products."""
    return supplier_service.create_supplier(db, data)


@router.put("/{supplier_id}", response_model=SupplierRead)
def update_supplier(
    supplier_id: int, data: SupplierUpdate, db: Session = Depends(get_db)
):
    """Update supplier details and product assignments. Returns 404 if not found."""
    supplier = supplier_service.get_supplier_by_id(db, supplier_id)
    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )
    return supplier_service.update_supplier(db, supplier, data)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    """Delete a supplier by id. Returns 404 if not found, 204 on success."""
    supplier = supplier_service.get_supplier_by_id(db, supplier_id)
    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found",
        )
    supplier_service.delete_supplier(db, supplier)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
