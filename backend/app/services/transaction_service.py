import uuid
from decimal import Decimal
from typing import List

from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.stock_movement import MovementType, StockMovement
from app.models.transaction import Transaction, TransactionItem
from app.schemas.transaction import TransactionCreate, TransactionItemRequest


def _generate_code() -> str:
    """Generate a unique transaction code like TRX-A1B2C3D4."""
    return f"TRX-{uuid.uuid4().hex[:8].upper()}"


def create_transaction(db: Session, data: TransactionCreate) -> Transaction:
    """
    Create a transaction atomically.

    Duplicate product IDs are merged before stock validation so that
    stock availability is checked against the total requested quantity.

    Raises:
        LookupError — product not found (→ 404)
        ValueError  — insufficient stock (→ 400)
    """
    # -------------------------------------------------------------------------
    # Phase 1: aggregate duplicate products
    # -------------------------------------------------------------------------
    quantities: dict[int, int] = {}

    for item in data.items:
        quantities[item.product_id] = (
            quantities.get(item.product_id, 0) + item.quantity
        )

    # -------------------------------------------------------------------------
    # Phase 2: validate EVERYTHING before touching the DB
    # -------------------------------------------------------------------------
    resolved: List[dict] = []

    for product_id, quantity in quantities.items():
        product = (
            db.query(Product)
            .filter(Product.id == product_id)
            .first()
        )

        if product is None:
            raise LookupError(f"Product id={product_id} not found.")

        if product.stock < quantity:
            raise ValueError(
                f"Insufficient stock for product '{product.name}' "
                f"(id={product.id}). "
                f"Available: {product.stock}, requested: {quantity}."
            )

        unit_price = Decimal(str(product.selling_price))
        subtotal = unit_price * quantity

        resolved.append(
            {
                "product": product,
                "quantity": quantity,
                "unit_price": unit_price,
                "subtotal": subtotal,
            }
        )

    # -------------------------------------------------------------------------
    # Phase 3: persist everything in one transaction
    # -------------------------------------------------------------------------
    total_amount = sum(
        (r["subtotal"] for r in resolved),
        Decimal("0"),
    )

    transaction_code = _generate_code()

    transaction = Transaction(
        transaction_code=transaction_code,
        total_amount=total_amount,
    )

    db.add(transaction)
    db.flush()

    for r in resolved:
        product: Product = r["product"]
        qty: int = r["quantity"]

        # TransactionItem
        item_row = TransactionItem(
            transaction_id=transaction.id,
            product_id=product.id,
            quantity=qty,
            unit_price=r["unit_price"],
            subtotal=r["subtotal"],
        )
        db.add(item_row)

        # StockMovement OUT
        stock_before = product.stock
        stock_after = stock_before - qty

        product.stock = stock_after

        movement = StockMovement(
            product_id=product.id,
            movement_type=MovementType.OUT,
            quantity=qty,
            stock_before=stock_before,
            stock_after=stock_after,
            reason=f"Sale — {transaction_code}",
        )
        db.add(movement)

    db.commit()
    db.refresh(transaction)

    transaction.items = (
        db.query(TransactionItem)
        .filter(TransactionItem.transaction_id == transaction.id)
        .all()
    )

    return transaction
