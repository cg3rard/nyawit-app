# Gunakan base image Python yang ringan dan stabil
FROM python:3.10-slim

# Set environment variables untuk mencegah buffer output Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Set working directory di dalam kontainer
WORKDIR /app

# Install dependensi sistem dasar untuk kompilasi C/C++
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy file requirements terlebih dahulu untuk caching layer Docker
COPY requirements.txt .

# Install dependensi Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy seluruh source code backend ke dalam kontainer
COPY . .

# Expose port FastAPI
EXPOSE 8000

# Jalankan server FastAPI menggunakan Uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]