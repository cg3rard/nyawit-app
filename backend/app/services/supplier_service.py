from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.supplier import Supplier
from app.models.product import Product
from app.schemas.supplier import SupplierCreate, SupplierUpdate


def get_suppliers(db: Session) -> List[Supplier]:
    """Return all suppliers ordered by id ascending."""
    return db.query(Supplier).order_by(Supplier.id.asc()).all()


def get_supplier_by_id(db: Session, supplier_id: int) -> Optional[Supplier]:
    """Return a single supplier by primary key, or None if not found."""
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()


def create_supplier(db: Session, data: SupplierCreate) -> Supplier:
    """
    Create a new supplier and assign selected products.
    """
    supplier = Supplier(
        name=data.name,
        whatsapp=data.whatsapp,
    )
    db.add(supplier)
    db.flush()

    if data.product_ids:
        # Assign products to this supplier
        db.query(Product).filter(Product.id.in_(data.product_ids)).update(
            {Product.supplier_id: supplier.id},
            synchronize_session=False,
        )

    db.commit()
    db.refresh(supplier)
    return supplier


def update_supplier(db: Session, supplier: Supplier, data: SupplierUpdate) -> Supplier:
    """
    Update supplier details and product assignments.
    """
    if data.name is not None:
        supplier.name = data.name
    if data.whatsapp is not None:
        supplier.whatsapp = data.whatsapp

    if data.product_ids is not None:
        # 1. Clear supplier_id for products currently assigned to this supplier
        db.query(Product).filter(Product.supplier_id == supplier.id).update(
            {Product.supplier_id: None},
            synchronize_session=False,
        )
        # 2. Assign the new products list
        if data.product_ids:
            db.query(Product).filter(Product.id.in_(data.product_ids)).update(
                {Product.supplier_id: supplier.id},
                synchronize_session=False,
            )

    db.commit()
    db.refresh(supplier)
    return supplier


def delete_supplier(db: Session, supplier: Supplier) -> bool:
    """
    Delete a supplier. Products assigned to them will have their supplier_id
    automatically set to NULL by the database foreign key constraint.
    """
    db.delete(supplier)
    db.commit()
    return True
