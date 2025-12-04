-- Создание таблиц для семейной социальной сети

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица бесед (чатов)
CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_group BOOLEAN NOT NULL DEFAULT false,
    avatar_url TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица участников бесед
CREATE TABLE IF NOT EXISTS chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chat_id, user_id)
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id),
    sender_id INTEGER NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    has_image BOOLEAN DEFAULT false,
    image_url TEXT,
    has_video BOOLEAN DEFAULT false,
    video_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица публикаций в ленте
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица лайков к публикациям
CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Таблица комментариев к публикациям
CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Вставка администратора по умолчанию
-- Логин: admin@family.local
-- Пароль: admin123
INSERT INTO users (name, email, password_hash, initials, role, status) 
VALUES ('Администратор', 'admin@family.local', 'admin123', 'АД', 'admin', 'approved')
ON CONFLICT (email) DO NOTHING;

-- Добавляем тестовых пользователей
INSERT INTO users (name, email, password_hash, initials, role, status) VALUES
('Елена', 'elena@family.local', 'password123', 'ЕС', 'user', 'approved'),
('Александр', 'alex@family.local', 'password123', 'АК', 'user', 'pending'),
('Мария', 'maria@family.local', 'password123', 'МВ', 'user', 'pending')
ON CONFLICT (email) DO NOTHING;

-- Создаём общий чат для семьи
INSERT INTO chats (name, is_group, created_by) VALUES
('Общий чат', true, 1),
('Родители', true, 1),
('Личный чат', false, 1);

-- Добавляем участников в общий чат (чат id=1)
INSERT INTO chat_members (chat_id, user_id) VALUES
(1, 1), (1, 2);

-- Добавляем участников в чат "Родители" (чат id=2)
INSERT INTO chat_members (chat_id, user_id) VALUES
(2, 1), (2, 2);

-- Добавляем участников в личный чат (чат id=3)
INSERT INTO chat_members (chat_id, user_id) VALUES
(3, 1), (3, 2);

-- Добавляем тестовые сообщения
INSERT INTO messages (chat_id, sender_id, text) VALUES
(1, 2, 'Привет всем!'),
(1, 1, 'Добро пожаловать в семейную сеть!'),
(3, 2, 'Привет! Как дела?'),
(3, 1, 'Отлично! А у тебя?');

-- Добавляем тестовые публикации
INSERT INTO posts (user_id, text, likes_count, comments_count) VALUES
(2, 'Какой прекрасный день! Были всей семьей на пикнике 🌳', 12, 5),
(1, 'Добро пожаловать в нашу семейную сеть! Делитесь новостями и фотографиями', 8, 3);