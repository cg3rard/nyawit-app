# Import all models here so Alembic and Base.metadata can discover every table.
from app.models.base import Base  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.stock_movement import StockMovement  # noqa: F401
from app.models.transaction import Transaction, TransactionItem  # noqa: F401
from app.models.supplier import Supplier  # noqa: F401
from app.models.restock_order import RestockOrder  # noqa: F401
from app.models.wa_settings import WASettings, WAMessage  # noqa: F401
