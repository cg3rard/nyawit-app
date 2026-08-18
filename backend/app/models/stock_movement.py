import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, func

from app.models.base import Base


class MovementType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUSTMENT = "ADJUSTMENT"


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    movement_type = Column(Enum(MovementType), nullable=False)
    quantity = Column(Integer, nullable=False)        # always positive — magnitude of change
    stock_before = Column(Integer, nullable=False)
    stock_after = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
