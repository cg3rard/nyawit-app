from typing import List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def get_products(db: Session) -> List[Product]:
    """Return all products ordered by id ascending."""
    return db.query(Product).order_by(Product.id.asc()).all()


def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
    """Return a single product by primary key, or None if not found."""
    return db.query(Product).filter(Product.id == product_id).first()


def create_product(db: Session, data: ProductCreate) -> Product:
    """
    Persist a new product and return it.
    Raises IntegrityError if product_code already exists.
    """
    product = Product(
        product_code=data.product_code,
        name=data.name,
        category=data.category,
        purchase_price=data.purchase_price,
        selling_price=data.selling_price,
        stock=data.stock,
        expiry_date=data.expiry_date,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product: Product, data: ProductUpdate) -> Product:
    """
    Apply partial updates to an existing product.
    Only fields explicitly set in `data` are updated.
    Raises IntegrityError if the new product_code conflicts.
    """
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    """Delete a product from the database."""
    db.delete(product)
    db.commit()
