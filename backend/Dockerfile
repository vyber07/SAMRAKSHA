FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libmagic1 \
    ffmpeg \
    libsm6 \
    libxext6 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install IndicTrans2 dependency from GitHub as requested in troubleshooting
RUN pip install --no-cache-dir git+https://github.com/AI4Bharat/IndicTrans2.git || echo "IndicTrans2 optional install failed, continuing..."

# Copy app code
COPY . .

# Expose port
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
