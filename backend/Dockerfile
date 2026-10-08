FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /repo/backend
COPY requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir -r requirements.txt
COPY fetch_stock_groups.py ./fetch_stock_groups.py
COPY tests ./tests

# docker-compose.override.yml supplies the entrypoint and default arguments.
