from datetime import datetime
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.wa_settings import WASettings, WAMessage
from app.models.restock_order import RestockOrder
from app.models.product import Product
from app.models.supplier import Supplier
from app.schemas.wa_settings import (
    WASettingsRead,
    WASettingsUpdate,
    WAMessageRead,
    RestockOrderRead,
    RestockOrderCreate,
    RestockConfirmationPayload,
    ReceiveRestockPayload,
)
from app.schemas.inventory import StockInRequest
from app.services import inventory_service

router = APIRouter(prefix="/api/wa", tags=["whatsapp"])


@router.get("/settings", response_model=WASettingsRead)
def get_wa_settings(db: Session = Depends(get_db)):
    """Retrieve WhatsApp Bot settings. We assume there's always one config row (id=1)."""
    settings = db.query(WASettings).filter(WASettings.id == 1).first()
    if not settings:
        # Fallback if somehow not seeded
        settings = WASettings(id=1, bot_name="CoStore Bot", phone_number="+628123456789", status="DISCONNECTED")
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.put("/settings", response_model=WASettingsRead)
def update_wa_settings(data: WASettingsUpdate, db: Session = Depends(get_db)):
    """Update WhatsApp Bot settings."""
    settings = db.query(WASettings).filter(WASettings.id == 1).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    return settings


@router.post("/connect", response_model=WASettingsRead)
def connect_wa_bot(db: Session = Depends(get_db)):
    """Simulate connecting the WhatsApp Bot."""
    settings = db.query(WASettings).filter(WASettings.id == 1).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    settings.status = "CONNECTED"
    settings.qr_code = None
    db.commit()
    db.refresh(settings)
    return settings


@router.post("/disconnect", response_model=WASettingsRead)
def disconnect_wa_bot(db: Session = Depends(get_db)):
    """Simulate disconnecting the WhatsApp Bot."""
    settings = db.query(WASettings).filter(WASettings.id == 1).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    settings.status = "DISCONNECTED"
    settings.qr_code = "MOCK_QR_CODE_DATA"
    db.commit()
    db.refresh(settings)
    return settings


from sqlalchemy.orm import joinedload

@router.get("/messages", response_model=List[WAMessageRead])
def get_wa_messages(db: Session = Depends(get_db)):
    """Return all WhatsApp message logs sent to suppliers, newest first."""
    return (
        db.query(WAMessage)
        .options(joinedload(WAMessage.restock_order))
        .order_by(WAMessage.id.desc())
        .all()
    )


@router.post("/send-restock", response_model=RestockOrderRead, status_code=status.HTTP_201_CREATED)
def send_restock_request(data: RestockOrderCreate, db: Session = Depends(get_db)):
    """
    Trigger restock: create RestockOrder and send a mock WhatsApp message log containing the confirmation link.
    """
    # 1. Verify product exists
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # 2. Check if product has a supplier assigned
    if not product.supplier_id:
        raise HTTPException(
            status_code=400,
            detail=f"Product '{product.name}' does not have any supplier assigned. Please assign a supplier first."
        )
    
    supplier = db.query(Supplier).filter(Supplier.id == product.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # 3. Create Restock Order in PENDING status
    order = RestockOrder(
        id=str(uuid.uuid4()),
        product_id=product.id,
        supplier_id=supplier.id,
        quantity=data.quantity,
        status="PENDING",
        token=uuid.uuid4().hex
    )
    db.add(order)
    db.flush() # ensure order.id and order.token are available

    # 4. Generate confirmation link
    confirm_link = f"http://localhost:5173/confirm_restock/{order.id}?token={order.token}"
    
    # 5. Create WhatsApp Message body
    message_text = (
        f"Halo {supplier.name},\n\n"
        f"Mohon untuk menyuplai kembali produk berikut ke toko kami:\n"
        f"- Nama Produk: {product.name}\n"
        f"- Kode Produk: {product.product_code}\n"
        f"- Jumlah: {data.quantity} pcs\n\n"
        f"Silakan konfirmasi pesanan restock ini dengan mengklik tautan berikut:\n"
        f"{confirm_link}\n\n"
        f"Terima kasih!\nCoStore Nyawit"
    )

    # 6. Save WAMessage log
    wa_message = WAMessage(
        supplier_id=supplier.id,
        restock_order_id=order.id,
        phone_number=supplier.whatsapp,
        message=message_text,
        status="SENT"
    )
    db.add(wa_message)
    db.commit()
    
    # Refresh to load relationships
    db.refresh(order)
    return order


@router.get("/restock-order/{order_id}", response_model=RestockOrderRead)
def get_restock_order(order_id: str, token: str, db: Session = Depends(get_db)):
    """
    Public endpoint to retrieve a restock order by UUID.
    Requires a valid token — returns 400 if missing or wrong.
    """
    if not token:
        raise HTTPException(
            status_code=400,
            detail="Token is required to view this restock order."
        )

    order = (
        db.query(RestockOrder)
        .filter(RestockOrder.id == order_id, RestockOrder.token == token)
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=400,
            detail="Invalid restock order ID or token. Access denied."
        )
    return order


@router.post("/confirm-restock/{order_id}")
def confirm_restock_order(
    order_id: str,
    token: str,
    payload: RestockConfirmationPayload,
    db: Session = Depends(get_db)
):
    """
    Public endpoint (supplier-facing): confirm or reject a restock order via UUID + token.
    Confirming does NOT update stock — the store owner must accept the goods separately.
    Returns 400 if token is missing or invalid.
    """
    if not token:
        raise HTTPException(
            status_code=400,
            detail="Token is required to confirm this restock order."
        )

    order = db.query(RestockOrder).filter(RestockOrder.id == order_id, RestockOrder.token == token).first()
    if not order:
        raise HTTPException(status_code=400, detail="Invalid restock order ID or token. Access denied.")

    if order.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"This restock order cannot be processed because its status is '{order.status}'"
        )

    order.confirmed_at = datetime.utcnow()
    order.supplier_note = payload.reason

    if not payload.confirm:
        order.status = "REJECTED"
        db.commit()
        return {"message": "Restock order rejected by supplier.", "status": "REJECTED"}

    if payload.quantity > order.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Quantity sent ({payload.quantity}) cannot exceed requested quantity ({order.quantity})."
        )
    if payload.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity sent must be greater than 0 if you are confirming the order."
        )

    # Mark as CONFIRMED — store the supplier-sent quantity in received_quantity as a hint
    order.status = "CONFIRMED"
    order.received_quantity = payload.quantity  # default hint; owner can override when receiving
    db.commit()
    return {"message": "Restock order confirmed by supplier. Awaiting store owner acceptance.", "status": "CONFIRMED"}


@router.post("/receive-restock/{order_id}")
def receive_restock(
    order_id: str,
    payload: ReceiveRestockPayload,
    db: Session = Depends(get_db)
):
    """
    Internal endpoint (store owner): marks a CONFIRMED order as RECEIVED and executes Stock IN.
    Requires the order to be in CONFIRMED state.
    """
    order = (
        db.query(RestockOrder)
        .options(joinedload(RestockOrder.supplier), joinedload(RestockOrder.product))
        .filter(RestockOrder.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Restock order not found.")

    if order.status != "CONFIRMED":
        raise HTTPException(
            status_code=400,
            detail=f"Only CONFIRMED orders can be received. Current status: '{order.status}'"
        )

    if payload.received_quantity <= 0:
        raise HTTPException(status_code=400, detail="Received quantity must be greater than 0.")

    # Build reason string
    supplier_name = order.supplier.name if order.supplier else "Supplier"
    expiry_note = f", Exp: {payload.received_expiry_date}" if payload.received_expiry_date else ""
    supplier_note = f", Catatan supplier: {order.supplier_note}" if order.supplier_note else ""
    reason = (
        f"Stock masuk dari konfirmasi supplier '{supplier_name}' "
        f"(diterima {payload.received_quantity} pcs{expiry_note}{supplier_note})"
    )

    stock_in_data = StockInRequest(
        product_id=order.product_id,
        quantity=payload.received_quantity,
        expiry_date=payload.received_expiry_date,
        reason=reason,
    )

    movement = inventory_service.stock_in(db, stock_in_data)
    if not movement:
        db.rollback()
        raise HTTPException(status_code=404, detail="Failed to process stock in: product not found.")

    # Update order fields
    order.status = "RECEIVED"
    order.received_quantity = payload.received_quantity
    order.received_expiry_date = payload.received_expiry_date
    order.received_at = datetime.utcnow()

    db.commit()
    db.refresh(order)
    return {"message": "Goods received and stock updated successfully.", "status": "RECEIVED"}

