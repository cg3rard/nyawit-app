import uuid
from datetime import date
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.stock_movement import MovementType, StockMovement
from app.models.transaction import Transaction, TransactionItem
from app.schemas.transaction import SalesSummary, TransactionCreate, TransactionItemRequest


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


# ---------------------------------------------------------------------------
# READ-ONLY queries — never write to DB, never touch stock
# ---------------------------------------------------------------------------

def _attach_items(db: Session, transaction: Transaction) -> Transaction:
    """Attach items list to a transaction object for response serialisation."""
    transaction.items = (
        db.query(TransactionItem)
        .filter(TransactionItem.transaction_id == transaction.id)
        .all()
    )
    return transaction


def get_transactions(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[Transaction]:
    """Return all transactions, newest first. Optionally filtered by date range."""
    q = db.query(Transaction)
    if start_date is not None:
        q = q.filter(Transaction.created_at >= start_date)
    if end_date is not None:
        # include the full end_date day
        from datetime import datetime, timedelta
        end_dt = datetime.combine(end_date, datetime.max.time())
        q = q.filter(Transaction.created_at <= end_dt)
    transactions = q.order_by(Transaction.id.desc()).all()
    for t in transactions:
        _attach_items(db, t)
    return transactions


def get_transaction_by_id(db: Session, transaction_id: int) -> Optional[Transaction]:
    """Return a single transaction with items, or None if not found."""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if transaction is None:
        return None
    return _attach_items(db, transaction)


def get_sales_summary(db: Session) -> SalesSummary:
    """Return aggregated totals. Pure SELECT — no writes."""
    total_transactions = db.query(func.count(Transaction.id)).scalar() or 0
    total_revenue = db.query(func.sum(Transaction.total_amount)).scalar() or Decimal("0")
    total_items_sold = db.query(func.sum(TransactionItem.quantity)).scalar() or 0

    return SalesSummary(
        total_transactions=int(total_transactions),
        total_revenue=Decimal(str(total_revenue)),
        total_items_sold=int(total_items_sold),
    )

def get_product_sales_14d(
    db: Session, 
    product_id: int, 
    target_date: date = None
) -> Tuple[List[int], List[int]]:
    """
    Mengambil dan mengagregasikan quantity penjualan 14 hari terakhir (H-13 s/d H-0),
    lalu membaginya menjadi sales_recent_7d dan sales_prior_7d dengan zero-filling.
    """
    if target_date is None:
        target_date = date.today()

    start_date = target_date - timedelta(days=13)

    # 1. Query agregasi harian via SQLAlchemy
    # Menggabungkan transactions dan transaction_items
    stmt = (
        select(
            func.date(Transaction.created_at).label("sale_date"),
            func.sum(TransactionItem.quantity).label("total_qty")
        )
        .join(TransactionItem, Transaction.id == TransactionItem.transaction_id)
        .where(
            TransactionItem.product_id == product_id,
            func.date(Transaction.created_at) >= start_date,
            func.date(Transaction.created_at) <= target_date
        )
        .group_by(func.date(Transaction.created_at))
    )

    results = db.execute(stmt).all()

    # Ubah hasil query menjadi mapping: {date: total_qty}
    sales_map: Dict[date, int] = {
        (row.sale_date if isinstance(row.sale_date, date) else date.fromisoformat(str(row.sale_date))): int(row.total_qty)
        for row in results
    }

    # 2. Zero-filling 14 hari penuh (H-13 s/d H-0)
    full_14_days: List[int] = []
    for i in range(13, -1, -1):
        current_day = target_date - timedelta(days=i)
        full_14_days.append(sales_map.get(current_day, 0))

    # 3. Pisahkan ke dua jendela 7 harian
    sales_prior_7d = full_14_days[0:7]    # Index 0..6 (H-13 s/d H-7)
    sales_recent_7d = full_14_days[7:14]  # Index 7..13 (H-6 s/d H-0)

    return sales_recent_7d, sales_prior_7d