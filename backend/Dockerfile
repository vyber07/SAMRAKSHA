FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for PostgreSQL, OpenCV, MediaPipe, etc.
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install python dependencies without cache
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

# Run uvicorn (main module is in the root directory)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
