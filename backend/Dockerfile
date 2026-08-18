# Python 3.10 retained: required by AI Engine (torch/bitsandbytes/peft).
# CoStore FastAPI is fully compatible with 3.10.
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# System deps for C/C++ compilation (required by bitsandbytes, scipy, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Make the CoStore entrypoint executable
RUN chmod +x entrypoint.sh

EXPOSE 8000

# Runs alembic migrations then starts the CoStore FastAPI app via app.main:app
CMD ["sh", "entrypoint.sh"]