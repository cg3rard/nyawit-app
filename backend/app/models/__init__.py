# Import all models here so Alembic and Base.metadata can discover every table.
from app.models.base import Base  # noqa: F401
from app.models.product import Product  # noqa: F401
