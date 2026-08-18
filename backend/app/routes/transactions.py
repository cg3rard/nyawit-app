from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.transaction import TransactionCreate, TransactionRead
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
