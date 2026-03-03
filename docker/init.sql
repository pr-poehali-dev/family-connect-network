-- Этот файл выполняется автоматически при первом запуске контейнера с БД.
-- Создаёт схему, все таблицы и первого администратора.

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

CREATE TABLE IF NOT EXISTS app.settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app.settings (key, value)
VALUES ('site_name', 'Альфа Семья')
ON CONFLICT (key) DO NOTHING;

-- Первый администратор (из переменных окружения через docker-entrypoint)
-- Создаётся через entrypoint скрипт, см. docker/create_admin.sh