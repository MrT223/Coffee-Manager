FROM python:3.11-slim

WORKDIR /project

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy both backend and database directories
COPY backend/ ./backend/
COPY database/ ./database/

# Set Python path so "from database.xxx" resolves to /project/database/
ENV PYTHONPATH=/project

WORKDIR /project/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
