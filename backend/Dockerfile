FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    postgresql-client \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "\
    echo 'Waiting for PostgreSQL...' && \
    until pg_isready -h db -p 5432 -q; do echo 'db not ready, retrying...'; sleep 2; done && \
    echo 'PostgreSQL is ready.' && \
    python manage.py migrate --noinput && \
    python manage.py runserver 0.0.0.0:8000"]
