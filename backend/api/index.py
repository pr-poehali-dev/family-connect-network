import json
import os
import psycopg2
import psycopg2.extras

SCHEMA = 't_p43528340_family_connect_netwo'

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    }

def response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': cors_headers(),
        'body': json.dumps(body, default=str, ensure_ascii=False)
    }

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
        SELECT id, name, initials, avatar_url, bio, position, status, role, created_at
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

def handler(event, context):
    """API для семейной соцсети — чаты, сообщения, посты, пользователи"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('queryStringParameters', {}) or {}
    action = path.get('action', '')

    if method == 'GET':
        if action == 'chats':
            return response(200, get_chats(path.get('user_id', 1)))
        elif action == 'messages':
            chat_id = path.get('chat_id')
            if not chat_id:
                return response(400, {'error': 'chat_id required'})
            return response(200, get_messages(int(chat_id)))
        elif action == 'posts':
            return response(200, get_posts())
        elif action == 'users':
            return response(200, get_users())
        else:
            return response(200, {'status': 'ok', 'actions': ['chats', 'messages', 'posts', 'users']})

    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        if action == 'send_message':
            chat_id = body.get('chat_id')
            sender_id = body.get('sender_id')
            text = body.get('text')
            if not all([chat_id, sender_id, text]):
                return response(400, {'error': 'chat_id, sender_id, text required'})
            return response(200, send_message(int(chat_id), int(sender_id), text))
        elif action == 'create_chat':
            name = body.get('name')
            is_group = body.get('is_group', True)
            created_by = body.get('created_by', 1)
            if not name:
                return response(400, {'error': 'name required'})
            return response(200, create_chat(name, is_group, int(created_by)))
        elif action == 'update_chat_avatar':
            chat_id = body.get('chat_id')
            avatar_url = body.get('avatar_url')
            if not all([chat_id, avatar_url]):
                return response(400, {'error': 'chat_id, avatar_url required'})
            return response(200, update_chat_avatar(int(chat_id), avatar_url))
        elif action == 'update_profile':
            user_id = body.get('user_id')
            name = body.get('name')
            bio = body.get('bio', '')
            position = body.get('position', '')
            if not all([user_id, name]):
                return response(400, {'error': 'user_id, name required'})
            result = update_user_profile(int(user_id), name, bio, position)
            if result:
                return response(200, result)
            return response(404, {'error': 'user not found'})
        else:
            return response(400, {'error': 'unknown action'})

    return response(405, {'error': 'method not allowed'})