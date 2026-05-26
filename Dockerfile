# syntax=docker/dockerfile:1.7

# ---- frontend build ----
FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# ---- backend runtime ----
FROM python:3.14-slim AS backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    STATIC_DIR=/app/static \
    ENV=production

WORKDIR /app

RUN groupadd --system app && useradd --system --gid app --home /app app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=app:app backend/ ./
COPY --from=frontend-build --chown=app:app /app/frontend/dist ./static

USER app

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8001/api/health',timeout=3).status==200 else 1)"

CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8001", \
     "--workers", "1", \
     "--proxy-headers", \
     "--forwarded-allow-ips=*"]
