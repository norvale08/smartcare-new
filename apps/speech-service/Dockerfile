FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    portaudio19-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Render sets this dynamically)
EXPOSE ${PORT:-10000}

# Option 1: Using config file (cleaner)
CMD gunicorn -c gunicorn.conf.py app:app

# Option 2: Using command-line flags (if no gunicorn.conf.py)
# CMD gunicorn \
#     --workers=2 \
#     --threads=2 \
#     --timeout=120 \
#     --bind=0.0.0.0:${PORT:-10000} \
#     --worker-tmp-dir=/dev/shm \
#     --access-logfile=- \
#     --error-logfile=- \
#     --log-level=info \
#     app:app