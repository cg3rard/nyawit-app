import uuid
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base


class RestockOrder(Base):
    __tablename__ = "restock_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Integer, nullable=False)
    # PENDING → CONFIRMED (by supplier) → RECEIVED (by owner) | REJECTED (by supplier)
    status = Column(String(20), nullable=False, default="PENDING")
    token = Column(String(64), nullable=False, unique=True, default=lambda: uuid.uuid4().hex)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    confirmed_at = Column(DateTime, nullable=True)   # when supplier confirmed
    supplier_note = Column(String(255), nullable=True)

    # Fields filled in by the store owner when physically receiving the goods
    received_quantity = Column(Integer, nullable=True)
    received_expiry_date = Column(Date, nullable=True)
    received_at = Column(DateTime, nullable=True)

    product = relationship("Product")
    supplier = relationship("Supplier")
