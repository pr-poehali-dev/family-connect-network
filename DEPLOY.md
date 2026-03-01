# Инструкция по переносу сайта на другой хостинг

Это полное руководство по переносу проекта на любой VPS/сервер с нуля.

---

## Что входит в проект

- **Frontend** — React SPA (готовая сборка: HTML + JS + CSS)
- **Backend** — Python 3.11 API-сервер (один файл, работает как HTTP-сервис)
- **База данных** — PostgreSQL (7 таблиц)

---

## Что понадобится на новом хостинге

- VPS или выделенный сервер (Ubuntu 20.04+)
- Docker и Docker Compose (рекомендуется) **или** ручная установка
- Доменное имя (опционально, но желательно)

---

## Шаг 1 — Скачать код проекта

На poehali.dev: **Скачать → Скачать код** (ZIP архив).

Распакуй архив:
```bash
unzip project.zip -d myapp
cd myapp
```

---

## Шаг 2 — Создать базу данных PostgreSQL

Установи PostgreSQL (если нет):
```bash
sudo apt update && sudo apt install -y postgresql postgresql-contrib
```

Создай БД и пользователя:
```bash
sudo -u postgres psql
```

```sql
CREATE USER myapp_user WITH PASSWORD 'СЮДА_ПРИДУМАЙ_ПАРОЛЬ';
CREATE DATABASE myapp_db OWNER myapp_user;
GRANT ALL PRIVILEGES ON DATABASE myapp_db TO myapp_user;
\q
```

---

## Шаг 3 — Создать схему и таблицы

Подключись к БД:
```bash
psql -U myapp_user -d myapp_db -h localhost
```

Выполни SQL ниже (создаёт все таблицы):

```sql
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE app.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    position VARCHAR(100) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    login VARCHAR(100) DEFAULT '',
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app.chats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_group BOOLEAN NOT NULL DEFAULT false,
    is_private BOOLEAN NOT NULL DEFAULT false,
    avatar_url TEXT,
    created_by INTEGER REFERENCES app.users(id),
    admin_id INTEGER REFERENCES app.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app.chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES app.chats(id),
    user_id INTEGER NOT NULL REFERENCES app.users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id, user_id)
);

CREATE TABLE app.messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES app.chats(id),
    sender_id INTEGER NOT NULL REFERENCES app.users(id),
    text TEXT NOT NULL,
    has_image BOOLEAN DEFAULT false,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    has_video BOOLEAN DEFAULT false,
    video_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app.posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES app.users(id),
    text TEXT NOT NULL,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE app.post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES app.posts(id),
    user_id INTEGER NOT NULL REFERENCES app.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

CREATE TABLE app.post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES app.posts(id),
    user_id INTEGER NOT NULL REFERENCES app.users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Создай первого администратора (замени данные):
```sql
INSERT INTO app.users (name, email, password_hash, initials, login, role, status)
VALUES (
    'Имя Администратора',
    'admin@alfa.local',
    encode(sha256('ВАШ_ПАРОЛЬ'::bytea), 'hex'),
    'АД',
    'admin',
    'admin',
    'approved'
);
```

> Пароль хранится как SHA-256. Если `sha256` недоступна — вычисли хеш командой:
> `echo -n "ВАШ_ПАРОЛЬ" | sha256sum`

---

## Шаг 4 — Настроить бэкенд

### Установи зависимости Python:
```bash
sudo apt install -y python3 python3-pip python3-venv
cd backend/api
python3 -m venv venv
source venv/bin/activate
pip install psycopg2-binary flask gunicorn
```

### Измени имя схемы в коде

Открой файл `backend/api/index.py`, найди строку:
```python
SCHEMA = 't_p43528340_family_connect_netwo'
```
Замени на:
```python
SCHEMA = 'app'
```

### Создай файл-обёртку для запуска Flask

Создай файл `backend/api/server.py`:
```python
import json
from flask import Flask, request, jsonify
from index import handler

app = Flask(__name__)

@app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy(path):
    body = request.get_data(as_text=True) or '{}'
    event = {
        'httpMethod': request.method,
        'path': '/' + path,
        'headers': dict(request.headers),
        'queryStringParameters': dict(request.args),
        'body': body,
    }
    result = handler(event, type('ctx', (), {'request_id': '1'})())
    resp_body = result.get('body', '{}')
    resp_headers = result.get('headers', {})
    status = result.get('statusCode', 200)
    response = app.response_class(
        response=resp_body,
        status=status,
        mimetype='application/json'
    )
    for k, v in resp_headers.items():
        response.headers[k] = v
    return response

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

### Создай .env файл с настройками:
```bash
# backend/api/.env
DATABASE_URL=postgresql://myapp_user:СЮДА_ПАРОЛЬ@localhost:5432/myapp_db
```

### Запусти бэкенд:
```bash
cd backend/api
source venv/bin/activate
export DATABASE_URL="postgresql://myapp_user:ПАРОЛЬ@localhost:5432/myapp_db"
gunicorn --bind 0.0.0.0:8000 server:app --workers 2 --daemon
```

---

## Шаг 5 — Собрать и раздать фронтенд

### Установи Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Укажи URL бэкенда во фронтенде

Создай файл `.env.production` в корне проекта:
```
VITE_API_URL=http://ВАШ_IP_ИЛИ_ДОМЕН:8000
```

Затем в `src/api.ts` (или где хранятся запросы) убедись, что URL берётся из переменной окружения.

### Собери фронтенд:
```bash
npm install
npm run build
```

Готовые файлы будут в папке `dist/`.

---

## Шаг 6 — Настроить Nginx

Установи Nginx:
```bash
sudo apt install -y nginx
```

Создай конфиг `/etc/nginx/sites-available/myapp`:
```nginx
server {
    listen 80;
    server_name ВАШ_ДОМЕН_ИЛИ_IP;

    # Фронтенд
    root /home/ubuntu/myapp/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Бэкенд API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Активируй и запусти:
```bash
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Шаг 7 — Автозапуск бэкенда (systemd)

Создай файл `/etc/systemd/system/myapp-api.service`:
```ini
[Unit]
Description=MyApp API
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/myapp/backend/api
Environment="DATABASE_URL=postgresql://myapp_user:ПАРОЛЬ@localhost:5432/myapp_db"
ExecStart=/home/ubuntu/myapp/backend/api/venv/bin/gunicorn --bind 0.0.0.0:8000 server:app --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

Включи сервис:
```bash
sudo systemctl daemon-reload
sudo systemctl enable myapp-api
sudo systemctl start myapp-api
```

---

## Шаг 8 — SSL-сертификат (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ВАШ_ДОМЕН
```

Certbot сам обновит конфиг Nginx и настроит автопродление.

---

## Перенос существующих данных (опционально)

Если хочешь перенести данные из текущей БД на poehali.dev:

1. Попроси администратора платформы выгрузить дамп БД (pg_dump)
2. Залей дамп на новый сервер:
```bash
psql -U myapp_user -d myapp_db < dump.sql
```

---

## Итоговая структура на сервере

```
/home/ubuntu/myapp/
├── dist/                  ← собранный фронтенд (Nginx раздаёт)
├── backend/
│   └── api/
│       ├── index.py       ← основной код API
│       ├── server.py      ← Flask-обёртка (создать вручную)
│       └── venv/          ← Python-окружение
└── .env.production        ← переменные для сборки фронтенда
```

---

## Контакты и поддержка

Если что-то не получается — напиши в наш Telegram: https://t.me/+QgiLIa1gFRY4Y2Iy
