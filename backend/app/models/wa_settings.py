from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.models.base import Base

class WASettings(Base):
    __tablename__ = "wa_settings"

    id = Column(Integer, primary_key=True, index=True)
    bot_name = Column(String(100), nullable=False, default="CoStore Bot")
    phone_number = Column(String(20), nullable=False, default="+628123456789")
    status = Column(String(50), nullable=False, default="DISCONNECTED")
    qr_code = Column(Text, nullable=True)

class WAMessage(Base):
    __tablename__ = "wa_messages"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    restock_order_id = Column(String(36), ForeignKey("restock_orders.id", ondelete="SET NULL"), nullable=True)
    phone_number = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="SENT")
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    supplier = relationship("Supplier")
    restock_order = relationship("RestockOrder")
