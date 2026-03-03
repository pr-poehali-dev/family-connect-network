#!/bin/bash
# Скрипт запускается после init.sql и создаёт первого администратора
# из переменных окружения .env

set -e

ADMIN_NAME="${ADMIN_NAME:-Администратор}"
ADMIN_LOGIN="${ADMIN_LOGIN:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
DB_USER="${POSTGRES_USER:-myapp_user}"
DB_NAME="${POSTGRES_DB:-myapp_db}"

echo "Создаю администратора '$ADMIN_NAME' (логин: $ADMIN_LOGIN)..."

psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" << SQL
INSERT INTO app.users (name, email, password_hash, initials, login, role, status)
VALUES (
    '$ADMIN_NAME',
    '${ADMIN_LOGIN}@alfa.local',
    encode(sha256('${ADMIN_PASSWORD}'::bytea), 'hex'),
    UPPER(LEFT('$ADMIN_NAME', 2)),
    '$ADMIN_LOGIN',
    'admin',
    'approved'
) ON CONFLICT (email) DO NOTHING;
SQL

echo "Администратор создан. Логин: $ADMIN_LOGIN"
