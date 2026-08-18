from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.stock_movement import MovementType, StockMovement
from app.schemas.inventory import (
    StockAdjustmentRequest,
    StockInRequest,
    StockOutRequest,
)


def _record_movement(
    db: Session,
    product: Product,
    movement_type: MovementType,
    quantity: int,
    stock_before: int,
    stock_after: int,
    reason: Optional[str],
) -> StockMovement:
    """
    Internal helper: write the movement record AND update product.stock
    in a single commit so both changes are atomic.
    """
    product.stock = stock_after

    movement = StockMovement(
        product_id=product.id,
        movement_type=movement_type,
        quantity=quantity,
        stock_before=stock_before,
        stock_after=stock_after,
        reason=reason,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


def stock_in(db: Session, data: StockInRequest) -> StockMovement:
    """Add stock to a product. Returns the movement record."""
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if product is None:
        return None  # caller raises 404

    stock_before = product.stock
    stock_after = stock_before + data.quantity

    return _record_movement(
        db, product, MovementType.IN, data.quantity, stock_before, stock_after, data.reason
    )


def stock_out(db: Session, data: StockOutRequest):
    """
    Remove stock from a product.

    Returns the movement record, or raises ValueError if stock is insufficient.
    Returns None if product is not found (caller raises 404).
    """
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if product is None:
        return None  # caller raises 404

    if product.stock < data.quantity:
        raise ValueError(
            f"Insufficient stock. Current: {product.stock}, requested: {data.quantity}."
        )

    stock_before = product.stock
    stock_after = stock_before - data.quantity

    return _record_movement(
        db, product, MovementType.OUT, data.quantity, stock_before, stock_after, data.reason
    )


def stock_adjustment(db: Session, data: StockAdjustmentRequest) -> StockMovement:
    """
    Set product stock to an absolute target value.

    quantity recorded = abs(new_stock - current_stock).
    Returns None if product not found (caller raises 404).
    """
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if product is None:
        return None  # caller raises 404

    stock_before = product.stock
    stock_after = data.new_stock
    quantity = abs(stock_after - stock_before)

    # quantity == 0 is valid for adjustment (no-op correction): still record it.
    return _record_movement(
        db, product, MovementType.ADJUSTMENT, quantity, stock_before, stock_after, data.reason
    )


def get_movements(
    db: Session,
    product_id: Optional[int] = None,
    movement_type: Optional[MovementType] = None,
) -> List[StockMovement]:
    """Return movement history, newest first. Optionally filtered by product_id and/or type."""
    q = db.query(StockMovement)
    if product_id is not None:
        q = q.filter(StockMovement.product_id == product_id)
    if movement_type is not None:
        q = q.filter(StockMovement.movement_type == movement_type)
    return q.order_by(StockMovement.id.desc()).all()
