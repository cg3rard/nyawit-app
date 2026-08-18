from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, func

from app.models.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_code = Column(String(50), unique=True, nullable=False, index=True)
    total_amount = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())


class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(
        Integer, ForeignKey("transactions.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    product_id = Column(
        Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)   # snapshot of selling_price at sale time
    subtotal = Column(Numeric(12, 2), nullable=False)
