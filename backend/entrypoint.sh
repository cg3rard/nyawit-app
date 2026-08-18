#!/bin/sh
# CoStore backend development entrypoint.
# Runs Alembic migrations before starting the API server.
# Alembic is the sole source of truth for database schema.

set -e

echo "Waiting for MySQL to be ready..."
until alembic upgrade head 2>/dev/null; do
  echo "  Database not ready yet — retrying in 3s..."
  sleep 3
done

echo "Migrations applied. Starting CoStore API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
