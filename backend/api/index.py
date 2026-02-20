import json
import os
import hashlib
import psycopg2
import psycopg2.extras

SCHEMA = 't_p43528340_family_connect_netwo'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    }

def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': cors_headers(),
        'body': json.dumps(body, default=str, ensure_ascii=False)
    }

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def register_user(name, password, phone='', login=''):
    """Регистрация нового пользователя"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    if phone:
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE phone = %s AND phone != ''", (phone,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return None, 'Пользователь с таким номером уже зарегистрирован'
    if login:
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE login = %s AND login != ''", (login,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return None, 'Пользователь с таким логином уже зарегистрирован'

    initials = ''.join([w[0].upper() for w in name.split()[:2]]) if name else 'НП'
    email = f"{login or phone}@alfa.local"
    pwd_hash = hash_password(password)

    cur.execute(f"""
        INSERT INTO {SCHEMA}.users (name, email, password_hash, initials, phone, login, status, role)
        VALUES (%s, %s, %s, %s, %s, %s, 'pending', 'user')
        RETURNING id, name, initials, avatar_url, bio, position, phone, login, status, role
    """, (name, email, pwd_hash, initials, phone or '', login or ''))
    user = dict(cur.fetchone())
    conn.commit()
    cur.close()
    conn.close()
    return user, None

def login_user(identifier, password):
    """Авторизация пользователя по телефону или логину"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    pwd_hash = hash_password(password)

    cur.execute(f"""
        SELECT id, name, initials, avatar_url, bio, position, phone, login, status, role
        FROM {SCHEMA}.users
        WHERE (phone = %s OR login = %s) AND password_hash = %s
    """, (identifier, identifier, pwd_hash))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if not user:
        return None, 'Неверный логин/телефон или пароль'
    return dict(user), None

def approve_user(user_id):
    """Одобрить пользователя (админ)"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        UPDATE {SCHEMA}.users SET status = 'approved', updated_at = NOW()
        WHERE id = %s
        RETURNING id, name, initials, status, role
    """, (user_id,))
    user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(user) if user else None

def reject_user(user_id):
    """Отклонить пользователя (админ)"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        UPDATE {SCHEMA}.users SET status = 'rejected', updated_at = NOW()
        WHERE id = %s
        RETURNING id, name, initials, status, role
    """, (user_id,))
    user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(user) if user else None

def get_chats(user_id):
    """Получить все беседы"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        SELECT c.id, c.name, c.is_group, c.avatar_url,
            COALESCE(
                (SELECT m.text FROM {SCHEMA}.messages m
                 WHERE m.chat_id = c.id
                 ORDER BY m.created_at DESC LIMIT 1),
                ''
            ) as last_message,
            0 as unread
        FROM {SCHEMA}.chats c
        ORDER BY c.updated_at DESC
    """)
    chats = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in chats]

def get_messages(chat_id):
    """Получить сообщения беседы"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        SELECT m.id, m.chat_id, m.sender_id, m.text, m.has_image, m.image_url,
            m.created_at,
            u.name as sender_name, u.initials as sender_initials
        FROM {SCHEMA}.messages m
        JOIN {SCHEMA}.users u ON u.id = m.sender_id
        WHERE m.chat_id = %s
        ORDER BY m.created_at ASC
    """, (chat_id,))
    messages = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in messages]

def send_message(chat_id, sender_id, text):
    """Отправить сообщение"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        INSERT INTO {SCHEMA}.messages (chat_id, sender_id, text)
        VALUES (%s, %s, %s)
        RETURNING id, chat_id, sender_id, text, has_image, image_url, created_at
    """, (chat_id, sender_id, text))
    msg = dict(cur.fetchone())
    cur.execute(f"UPDATE {SCHEMA}.chats SET updated_at = NOW() WHERE id = %s", (chat_id,))
    conn.commit()
    cur.close()
    conn.close()
    return msg

def create_chat(name, is_group, created_by):
    """Создать новую беседу"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        INSERT INTO {SCHEMA}.chats (name, is_group, created_by)
        VALUES (%s, %s, %s)
        RETURNING id, name, is_group, avatar_url, created_at
    """, (name, is_group, created_by))
    chat = dict(cur.fetchone())
    cur.execute(f"""
        INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES (%s, %s)
    """, (chat['id'], created_by))
    conn.commit()
    cur.close()
    conn.close()
    return chat

def update_chat_avatar(chat_id, avatar_url):
    """Обновить аватар беседы"""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"""
        UPDATE {SCHEMA}.chats SET avatar_url = %s, updated_at = NOW() WHERE id = %s
    """, (avatar_url, chat_id))
    conn.commit()
    cur.close()
    conn.close()
    return {'success': True}

def get_posts():
    """Получить посты"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        SELECT p.id, p.user_id, p.text, p.image_url, p.likes_count, p.comments_count,
            p.created_at, u.name as user_name, u.initials as user_initials
        FROM {SCHEMA}.posts p
        JOIN {SCHEMA}.users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
    """)
    posts = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in posts]

def get_users():
    """Получить всех пользователей"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        SELECT id, name, initials, avatar_url, bio, position, phone, login, status, role, created_at
        FROM {SCHEMA}.users
        ORDER BY id
    """)
    users = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in users]

def update_user_profile(user_id, name, bio=None, position=None):
    """Обновить профиль пользователя"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    initials = ''.join([w[0].upper() for w in name.split()[:2]]) if name else ''
    cur.execute(f"""
        UPDATE {SCHEMA}.users SET name = %s, initials = %s, bio = %s, position = %s, updated_at = NOW()
        WHERE id = %s
        RETURNING id, name, initials, avatar_url, bio, position, status, role
    """, (name, initials, bio, position or '', user_id))
    user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(user) if user else None

def get_body(event):
    """Получить данные из body (POST) или query (GET)"""
    method = event.get('httpMethod', 'GET')
    if method == 'POST':
        raw = event.get('body', '{}')
        if raw:
            return json.loads(raw)
    return {}

def handler(event, context):
    """API для семейной соцсети Альфа Семья"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', '')
    body = get_body(event)
    p = {**params, **body}

    if action == 'chats':
        return response(200, get_chats(p.get('user_id', 1)))

    elif action == 'messages':
        chat_id = p.get('chat_id')
        if not chat_id:
            return response(400, {'error': 'chat_id required'})
        return response(200, get_messages(int(chat_id)))

    elif action == 'posts':
        return response(200, get_posts())

    elif action == 'users':
        return response(200, get_users())

    elif action == 'login':
        identifier = p.get('identifier', '').strip()
        password = p.get('password', '')
        if not identifier or not password:
            return response(400, {'error': 'Укажите логин/телефон и пароль'})
        user, err = login_user(identifier, password)
        if err:
            return response(400, {'error': err})
        return response(200, user)

    elif action == 'register':
        name = p.get('name', '').strip()
        password = p.get('password', '')
        phone = p.get('phone', '').strip()
        login = p.get('login', '').strip()
        if not name or not password:
            return response(400, {'error': 'Укажите имя и пароль'})
        if not phone and not login:
            return response(400, {'error': 'Укажите номер телефона или логин'})
        if login and not login.startswith('U_'):
            return response(400, {'error': 'Логин должен начинаться с U_'})
        user, err = register_user(name, password, phone, login)
        if err:
            return response(400, {'error': err})
        return response(200, user)

    elif action == 'approve_user':
        user_id = p.get('user_id')
        if not user_id:
            return response(400, {'error': 'user_id required'})
        result = approve_user(int(user_id))
        return response(200, result) if result else response(404, {'error': 'user not found'})

    elif action == 'reject_user':
        user_id = p.get('user_id')
        if not user_id:
            return response(400, {'error': 'user_id required'})
        result = reject_user(int(user_id))
        return response(200, result) if result else response(404, {'error': 'user not found'})

    elif action == 'send_message':
        chat_id = p.get('chat_id')
        sender_id = p.get('sender_id')
        text = p.get('text', '')
        if not all([chat_id, sender_id, text]):
            return response(400, {'error': 'chat_id, sender_id, text required'})
        return response(200, send_message(int(chat_id), int(sender_id), text))

    elif action == 'create_chat':
        name = p.get('name', '')
        is_group = p.get('is_group', 'true')
        if isinstance(is_group, str):
            is_group = is_group.lower() == 'true'
        created_by = p.get('created_by', 1)
        if not name:
            return response(400, {'error': 'name required'})
        return response(200, create_chat(name, is_group, int(created_by)))

    elif action == 'update_chat_avatar':
        chat_id = p.get('chat_id')
        avatar_url = p.get('avatar_url', '')
        if not all([chat_id, avatar_url]):
            return response(400, {'error': 'chat_id, avatar_url required'})
        return response(200, update_chat_avatar(int(chat_id), avatar_url))

    elif action == 'update_profile':
        user_id = p.get('user_id')
        name = p.get('name', '')
        bio = p.get('bio', '')
        position = p.get('position', '')
        if not all([user_id, name]):
            return response(400, {'error': 'user_id, name required'})
        result = update_user_profile(int(user_id), name, bio, position)
        if result:
            return response(200, result)
        return response(404, {'error': 'user not found'})

    else:
        return response(200, {'status': 'ok'})