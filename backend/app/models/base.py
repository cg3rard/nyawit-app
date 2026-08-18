from sqlalchemy.orm import declarative_base

# Single shared Base for all SQLAlchemy models.
# All models must inherit from this Base so that
# Alembic can discover them via app.models.__init__.py.
Base = declarative_base()
