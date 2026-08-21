from typing import List, Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.stock_movement import MovementType, StockMovement
from app.models.transaction import TransactionItem
from app.schemas.product import ProductCreate, ProductUpdate


def get_products(db: Session) -> List[Product]:
    """Return all products ordered by id ascending."""
    return (
        db.query(Product)
        .options(joinedload(Product.supplier))
        .order_by(Product.id.asc())
        .all()
    )


def get_product_by_id(db: Session, product_id: int) -> Optional[Product]:
    """Return a single product by primary key, or None if not found."""
    return (
        db.query(Product)
        .options(joinedload(Product.supplier))
        .filter(Product.id == product_id)
        .first()
    )


def create_product(db: Session, data: ProductCreate) -> Product:
    """
    Create a product and record its initial stock as an inventory movement.
    Both operations are committed in a single transaction.
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
        supplier_id=data.supplier_id,
    )

    db.add(product)
    db.flush()

    if data.stock > 0:
        movement = StockMovement(
            product_id=product.id,
            movement_type=MovementType.ADJUSTMENT,
            quantity=data.stock,
            stock_before=0,
            stock_after=data.stock,
            reason="Initial stock",
        )
        db.add(movement)

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


def delete_product(db: Session, product: Product) -> bool:
    """
    Delete a product and its inventory movement history.
    Prevents deletion if the product is linked to sales transactions.
    """
    has_transactions = (
        db.query(TransactionItem)
        .filter(TransactionItem.product_id == product.id)
        .first()
        is not None
    )

    if has_transactions:
        return False

    # Remove stock movements associated with this product before deletion
    db.query(StockMovement).filter(StockMovement.product_id == product.id).delete()
    db.delete(product)
    db.commit()
    return True

