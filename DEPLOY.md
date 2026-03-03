# Инструкция по развёртыванию сайта

Полное руководство по запуску проекта на своём сервере — с нуля до готового сайта.

Есть два способа: **быстрый через Docker** (рекомендуется) или **ручной** (по шагам ниже).

---

## Что входит в проект

- **Сайт (frontend)** — готовые HTML + JS + CSS файлы
- **Сервер (backend)** — Python API, обрабатывает запросы
- **База данных** — PostgreSQL, 7 таблиц (создаётся автоматически)

---

## Быстрый запуск через Docker (рекомендуется)

Docker — программа, которая сама устанавливает все зависимости и запускает всё одной командой. База данных создаётся автоматически.

### 1. Установи Docker на сервере:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Скачай код проекта и распакуй:
```bash
unzip project.zip -d myapp && cd myapp
```

### 3. Создай файл с паролями (`.env`):
```bash
cp .env.example .env
nano .env
```
Заполни три значения — придумай пароли для БД и администратора, укажи IP сервера:
```
DB_PASSWORD=ПРИДУМАЙ_ПАРОЛЬ_ДЛЯ_БД
ADMIN_PASSWORD=ПРИДУМАЙ_ПАРОЛЬ_АДМИНИСТРАТОРА
VITE_API_URL=http://ВАШ_IP
```

### 4. Запусти всё одной командой:
```bash
docker compose up -d --build
```

Готово! Сайт откроется по адресу `http://ВАШ_IP`.
База данных, все таблицы и администратор создадутся сами.

### Полезные команды Docker:
```bash
docker compose logs -f        # логи всех сервисов
docker compose restart api    # перезапустить бэкенд
docker compose down           # остановить всё
docker compose up -d          # запустить снова (без пересборки)
```

---

## Ручной способ (без Docker)

## Какой хостинг выбрать

Рекомендуем **VPS-хостинг** — это виртуальный сервер, которым ты управляешь полностью.

| Хостинг | Цена/мес | Ссылка | Примечание |
|---|---|---|---|
| **Timeweb Cloud** | от 200 ₽ | https://timeweb.cloud | Русский, поддержка 24/7 |
| **Selectel** | от 350 ₽ | https://selectel.ru | Надёжный, русский |
| **Beget VPS** | от 299 ₽ | https://beget.com | Популярный в РФ |
| **Hetzner** | от €4 | https://hetzner.com | Дёшево, Европа |
| **DigitalOcean** | от $6 | https://digitalocean.com | Удобная панель |

**Что брать:** Ubuntu 22.04, минимум 1 CPU / 1 GB RAM / 20 GB SSD.

---

## Какие программы понадобятся

### На твоём компьютере (для подключения к серверу):

| Программа | Для чего | Ссылка |
|---|---|---|
| **Termius** | Подключение к серверу по SSH (удобный интерфейс) | https://termius.com |
| **PuTTY** | Подключение к серверу по SSH (простой, только Windows) | https://putty.org |
| **WinSCP** | Загрузка файлов на сервер (только Windows) | https://winscp.net |
| **FileZilla** | Загрузка файлов на сервер (Windows/Mac) | https://filezilla-project.org |
| **VS Code** | Редактор кода (если нужно что-то поправить) | https://code.visualstudio.com |

> Для Mac/Linux терминал встроен — дополнительных программ не нужно.

### На сервере (устанавливается автоматически через команды ниже):

- **Python 3** — запускает бэкенд
- **Node.js** — собирает фронтенд
- **PostgreSQL** — база данных
- **Nginx** — раздаёт сайт посетителям

---

## Шаг 1 — Скачать код проекта

На poehali.dev: **Скачать → Скачать код** (ZIP архив).

Загрузи ZIP на сервер через WinSCP/FileZilla в папку `/home/ubuntu/`.

Подключись к серверу по SSH и распакуй:
```bash
cd /home/ubuntu
unzip project.zip -d myapp
cd myapp
```

---

## Шаг 2 — Установить всё необходимое на сервер

Одна команда устанавливает всё сразу:
```bash
sudo apt update && sudo apt install -y \
  postgresql postgresql-contrib \
  python3 python3-pip python3-venv \
  nginx \
  unzip curl

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## Шаг 3 — Создать базу данных и все таблицы автоматически

Скрипт ниже сделает всё сам: создаст пользователя БД, базу, все 7 таблиц и первого администратора.

**Сначала задай свои пароли** — открой файл `setup_db.sh` и замени значения:
```bash
nano /home/ubuntu/myapp/setup_db.sh
```

Создай файл `setup_db.sh`:
```bash
cat > /home/ubuntu/myapp/setup_db.sh << 'SCRIPT'
#!/bin/bash

# ╔══════════════════════════════════╗
# ║  ИЗМЕНИ ЭТИ ЗНАЧЕНИЯ ПЕРЕД      ║
# ║  ЗАПУСКОМ!                      ║
# ╚══════════════════════════════════╝
DB_USER="myapp_user"
DB_PASSWORD="ПРИДУМАЙ_ПАРОЛЬ_ДЛЯ_БД"
DB_NAME="myapp_db"
ADMIN_NAME="Администратор"
ADMIN_LOGIN="admin"
ADMIN_PASSWORD="ПРИДУМАЙ_ПАРОЛЬ_АДМИНИСТРАТОРА"

# ── Создаём пользователя и базу ──────────────────────────────────────────────
echo "Создаю пользователя и базу данных..."
sudo -u postgres psql << SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  END IF;
END \$\$;
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL

# ── Создаём схему и таблицы ───────────────────────────────────────────────────
echo "Создаю таблицы..."
PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -d "$DB_NAME" -h localhost << SQL

CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.users (
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

CREATE TABLE IF NOT EXISTS app.chats (
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

CREATE TABLE IF NOT EXISTS app.chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES app.chats(id),
    user_id INTEGER NOT NULL REFERENCES app.users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS app.messages (
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

CREATE TABLE IF NOT EXISTS app.posts (
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

CREATE TABLE IF NOT EXISTS app.post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES app.posts(id),
    user_id INTEGER NOT NULL REFERENCES app.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS app.post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES app.posts(id),
    user_id INTEGER NOT NULL REFERENCES app.users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Первый администратор
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

echo ""
echo "✅ База данных создана успешно!"
echo "   Пользователь БД: $DB_USER"
echo "   База данных: $DB_NAME"
echo "   Логин администратора: $ADMIN_LOGIN"
echo ""
echo "Сохрани строку подключения:"
echo "   DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
SCRIPT

chmod +x /home/ubuntu/myapp/setup_db.sh
echo "Файл setup_db.sh создан. Открой его (nano setup_db.sh), задай пароли и запусти: bash setup_db.sh"
```

Теперь запусти создание скрипта, потом отредактируй пароли и запусти его:
```bash
# 1. Создать файл скрипта
bash /home/ubuntu/myapp/setup_db.sh  # первый раз создаст файл

# 2. Открой и замени пароли
nano /home/ubuntu/myapp/setup_db.sh

# 3. Запусти — создаст БД и все таблицы
bash /home/ubuntu/myapp/setup_db.sh
```

---

## Шаг 4 — Настроить бэкенд

```bash
cd /home/ubuntu/myapp/backend/api

# Установи зависимости
python3 -m venv venv
source venv/bin/activate
pip install psycopg2-binary flask gunicorn
```

Измени имя схемы в коде бэкенда:
```bash
sed -i "s/SCHEMA = 't_p43528340_family_connect_netwo'/SCHEMA = 'app'/" index.py
```

Создай файл-обёртку `server.py`:
```bash
cat > /home/ubuntu/myapp/backend/api/server.py << 'EOF'
from flask import Flask, request
from index import handler

app = Flask(__name__)

@app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
def proxy(path):
    event = {
        'httpMethod': request.method,
        'path': '/' + path,
        'headers': dict(request.headers),
        'queryStringParameters': dict(request.args),
        'body': request.get_data(as_text=True) or '{}',
    }
    result = handler(event, type('ctx', (), {'request_id': '1'})())
    resp = app.response_class(
        response=result.get('body', '{}'),
        status=result.get('statusCode', 200),
        mimetype='application/json'
    )
    for k, v in result.get('headers', {}).items():
        resp.headers[k] = v
    return resp
EOF
```

---

## Шаг 5 — Собрать фронтенд

```bash
cd /home/ubuntu/myapp

# Укажи адрес своего сервера (замени на свой IP или домен)
echo "VITE_API_URL=http://ВАШ_IP:8000" > .env.production

npm install
npm run build
# Готовые файлы сайта — в папке dist/
```

---

## Шаг 6 — Настроить автозапуск

### Бэкенд (systemd):
```bash
# Замени ПАРОЛЬ_БД на свой пароль
sudo tee /etc/systemd/system/myapp-api.service << EOF
[Unit]
Description=MyApp API
After=network.target postgresql.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/myapp/backend/api
Environment="DATABASE_URL=postgresql://myapp_user:ПАРОЛЬ_БД@localhost:5432/myapp_db"
ExecStart=/home/ubuntu/myapp/backend/api/venv/bin/gunicorn --bind 0.0.0.0:8000 server:app --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable myapp-api
sudo systemctl start myapp-api
```

### Nginx (раздаёт сайт):
```bash
# Замени ВАШ_ДОМЕН_ИЛИ_IP на свои данные
sudo tee /etc/nginx/sites-available/myapp << EOF
server {
    listen 80;
    server_name ВАШ_ДОМЕН_ИЛИ_IP;

    root /home/ubuntu/myapp/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

---

## Шаг 7 — SSL-сертификат (HTTPS, только если есть домен)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ВАШ_ДОМЕН
```

Сертификат бесплатный, продлевается автоматически.

---

## Проверка — всё ли работает

```bash
# Статус бэкенда
sudo systemctl status myapp-api

# Статус nginx
sudo systemctl status nginx

# Логи бэкенда (если что-то не так)
sudo journalctl -u myapp-api -n 50
```

---

## Итого — порядок действий

1. Арендовать VPS (Ubuntu 22.04, 1 GB RAM)
2. Подключиться по SSH (Termius или PuTTY)
3. Загрузить код через WinSCP/FileZilla
4. Выполнить команды из Шагов 2–6
5. Открыть сайт по IP сервера в браузере

---

## Поддержка

Если что-то не получается — напиши в наш Telegram: https://t.me/+QgiLIa1gFRY4Y2Iy