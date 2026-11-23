FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    CAMPUS_ENV=production \
    CAMPUS_DATA_DIR=/data/campus \
    PORT=8080

WORKDIR /app
# Chroma's native runtime requires libstdc++; no model or build tools are needed.
RUN apt-get update && apt-get install -y --no-install-recommends libstdc++6 \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.lock.txt /app/backend/requirements.lock.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.lock.txt
COPY backend/ /app/backend/
COPY prototype/ /app/prototype/

# Railway volumes are owned by root. The container exposes only the app, never
# a separate Chroma port. Keep the volume attached when replacing deployments.
EXPOSE 8080
CMD ["python", "-m", "backend.serve"]
