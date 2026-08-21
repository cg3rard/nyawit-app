from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.stock_movement import MovementType, StockMovement
from app.schemas.inventory import (
    StockAdjustmentRequest,
    StockInRequest,
    StockOutRequest,
)
from app.services.transaction_service import get_product_sales_14d
from engine.metrics import InventoryEngine
from app.routes.ai import get_llm_recommendation


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


def stock_in(db: Session, data: StockInRequest) -> Optional[StockMovement]:
    """Add stock to a product. If expiry_date is provided, updates product.expiry_date."""
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if product is None:
        return None

    if data.expiry_date is not None:
        product.expiry_date = data.expiry_date

    stock_before = product.stock
    stock_after = stock_before + data.quantity

    return _record_movement(
        db,
        product,
        MovementType.IN,
        data.quantity,
        stock_before,
        stock_after,
        data.reason,
    )


def stock_out(db: Session, data: StockOutRequest) -> Optional[StockMovement]:
    """Remove stock from a product. Raises ValueError if stock is insufficient."""
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if product is None:
        return None

    if product.stock < data.quantity:
        raise ValueError(
            f"Insufficient stock. Current: {product.stock}, requested: {data.quantity}."
        )

    stock_before = product.stock
    stock_after = stock_before - data.quantity

    return _record_movement(
        db,
        product,
        MovementType.OUT,
        data.quantity,
        stock_before,
        stock_after,
        data.reason,
    )


def stock_adjustment(db: Session, data: StockAdjustmentRequest) -> Optional[StockMovement]:
    """Set product stock to an absolute target value."""
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if product is None:
        return None

    stock_before = product.stock
    stock_after = data.new_stock
    quantity = abs(stock_after - stock_before)

    return _record_movement(
        db,
        product,
        MovementType.ADJUSTMENT,
        quantity,
        stock_before,
        stock_after,
        data.reason,
    )


def get_movements(
    db: Session,
    product_id: Optional[int] = None,
    movement_type: Optional[MovementType] = None,
) -> List[StockMovement]:
    """Return movement history, newest first."""
    q = db.query(StockMovement).options(joinedload(StockMovement.product))

    if product_id is not None:
        q = q.filter(StockMovement.product_id == product_id)
    if movement_type is not None:
        q = q.filter(StockMovement.movement_type == movement_type)

    return q.order_by(StockMovement.id.desc()).all()


# ---------------------------------------------------------------------------
# AI Inventory Health & Risk Evaluation Queries
# ---------------------------------------------------------------------------

def evaluate_product_health(db: Session, product_id: int) -> Optional[Dict[str, Any]]:
    """
    Evaluasi kesehatan inventaris 1 produk:
    1. Mengambil data sisa stok dari tabel Product.
    2. Menghitung runtun waktu penjualan 14 hari via transaction_service.
    3. Menjalankan InventoryEngine (SMA, DOI, Trend, Status).
    4. Menjalankan inferensi rekomendasi model AI.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return None

    sales_recent_7d, sales_prior_7d = get_product_sales_14d(db=db, product_id=product.id)

    metrics = InventoryEngine.calculate_metrics(
        product_name=product.name,
        current_stock=product.stock,
        sales_recent_7d=sales_recent_7d,
        sales_prior_7d=sales_prior_7d,
    )

    ai_recommendation = get_llm_recommendation(metrics.prompt_payload, metrics.status)

    return {
        "product_id": product.id,
        "product_name": product.name,
        "product_code": product.product_code,
        "status": metrics.status,
        "metrics": {
            "current_stock": metrics.current_stock,
            "sma_7_daily": metrics.sma_7,
            "sma_prior_daily": metrics.sma_prior,
            "sales_trend_pct": f"{metrics.trend_pct:+}%",
            "days_of_inventory": metrics.days_of_inventory,
        },
        "sales_history": {
            "recent_7d": sales_recent_7d,
            "prior_7d": sales_prior_7d,
        },
        "prompt_payload": metrics.prompt_payload,
        "ai_recommendation": ai_recommendation,
    }


def evaluate_all_inventory(db: Session) -> List[Dict[str, Any]]:
    """
    Evaluasi seluruh katalog produk untuk mendeteksi risiko Merah & Kuning.
    Diurutkan berdasarkan prioritas urgensi: Merah (DOI terendah) lalu Kuning (Stok terbesar).
    """
    products = db.query(Product).all()
    results = []

    for product in products:
        sales_recent_7d, sales_prior_7d = get_product_sales_14d(db=db, product_id=product.id)
        metrics = InventoryEngine.calculate_metrics(
            product_name=product.name,
            current_stock=product.stock,
            sales_recent_7d=sales_recent_7d,
            sales_prior_7d=sales_prior_7d,
        )
        
        # Eksekusi AI hanya untuk status berisiko (Merah/Kuning) untuk optimasi latensi
        if metrics.status in ("Merah", "Kuning"):
            ai_rec = get_llm_recommendation(metrics.prompt_payload, metrics.status)
        else:
            ai_rec = {
                "action": "MONITORING_RUTIN",
                "recommendation": "Pertahankan stok dan lanjutkan siklus pengadaan standar.",
                "rationale": "Kondisi persediaan dan tren perputaran produk stabil."
            }

        results.append({
            "product_id": product.id,
            "product_name": product.name,
            "product_code": product.product_code,
            "status": metrics.status,
            "metrics": {
                "current_stock": metrics.current_stock,
                "sma_7_daily": metrics.sma_7,
                "sma_prior_daily": metrics.sma_prior,
                "sales_trend_pct": f"{metrics.trend_pct:+}%",
                "days_of_inventory": metrics.days_of_inventory,
            },
            "ai_recommendation": ai_rec,
        })

    # Sort: Merah (DOI ASC), Kuning (Stock DESC), Hijau
    def sort_order(item):
        status = item["status"]
        if status == "Merah":
            return (0, item["metrics"]["days_of_inventory"])
        elif status == "Kuning":
            return (1, -item["metrics"]["current_stock"])
        return (2, 0)

    results.sort(key=sort_order)
    return results