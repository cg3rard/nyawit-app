from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.transaction import SalesSummary, TransactionCreate, TransactionRead
from app.services import transaction_service

router = APIRouter(prefix="/api/transactions", tags=["transactions"])

@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    """
    Create a sales transaction.

    - Validates all products exist (404 if any missing).
    - Validates all quantities > 0 (422 via Pydantic).
    - Validates sufficient stock for every item (400 if not).
    - Deducts stock and records StockMovement OUT for each item.
    - All changes are committed atomically — partial failures rollback fully.
    """
    try:
        return transaction_service.create_transaction(db, data)
    except LookupError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

@router.get("/summary", response_model=SalesSummary)
def get_sales_summary(db: Session = Depends(get_db)):
    """
    Return aggregated sales totals: transaction count, total revenue, total items sold.
    READ-ONLY — does not modify stock or any records.
    """
    return transaction_service.get_sales_summary(db)

@router.get("/", response_model=List[TransactionRead])
def list_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    """
    Return all transactions ordered newest first.
    Optionally filter by start_date and/or end_date (inclusive).
    READ-ONLY — does not modify any records.
    """
    return transaction_service.get_transactions(db, start_date=start_date, end_date=end_date)

@router.get("/{transaction_id}", response_model=TransactionRead)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """
    Return a single transaction with all its items.
    Returns 404 if the transaction does not exist.
    READ-ONLY — does not modify any records.
    """
    transaction = transaction_service.get_transaction_by_id(db, transaction_id)
    if transaction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction id={transaction_id} not found.",
        )
    return transaction
