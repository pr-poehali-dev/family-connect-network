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
    """Получить беседы только тех чатов, в которых состоит пользователь"""
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
        JOIN {SCHEMA}.chat_members cm ON cm.chat_id = c.id
        WHERE cm.user_id = %s
        ORDER BY c.updated_at DESC
    """, (user_id,))
    chats = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in chats]

def get_messages(chat_id, user_id=None):
    """Получить сообщения беседы — только если пользователь является участником"""
    if user_id:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT 1 FROM {SCHEMA}.chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, user_id))
        member = cur.fetchone()
        cur.close(); conn.close()
        if not member:
            return None
    """Получить сообщения беседы"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        SELECT m.id, m.chat_id, m.sender_id, m.text, m.has_image, m.image_url,
            m.images, m.created_at,
            u.name as sender_name, u.initials as sender_initials
        FROM {SCHEMA}.messages m
        JOIN {SCHEMA}.users u ON u.id = m.sender_id
        WHERE m.chat_id = %s
        ORDER BY m.created_at ASC
    """, (chat_id,))
    messages = cur.fetchall()
    cur.close()
    conn.close()
    result = []
    for r in messages:
        d = dict(r)
        if not d.get('images'):
            d['images'] = []
        result.append(d)
    return result

def send_message(chat_id, sender_id, text, images=None):
    """Отправить сообщение (images — список dataURL/URL)"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    if images is None:
        images = []
    has_image = len(images) > 0
    image_url = images[0] if images else None
    cur.execute(f"""
        INSERT INTO {SCHEMA}.messages (chat_id, sender_id, text, has_image, image_url, images)
        VALUES (%s, %s, %s, %s, %s, %s)
        RETURNING id, chat_id, sender_id, text, has_image, image_url, images, created_at
    """, (chat_id, sender_id, text, has_image, image_url, json.dumps(images)))
    msg = dict(cur.fetchone())
    if not msg.get('images'):
        msg['images'] = []
    cur.execute(f"UPDATE {SCHEMA}.chats SET updated_at = NOW() WHERE id = %s", (chat_id,))
    conn.commit()
    cur.close()
    conn.close()
    return msg

def create_post(user_id, text, images=None):
    """Создать публикацию (images — список dataURL/URL)"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    if images is None:
        images = []
    image_url = images[0] if images else None
    cur.execute(f"""
        INSERT INTO {SCHEMA}.posts (user_id, text, image_url, images)
        VALUES (%s, %s, %s, %s)
        RETURNING id, user_id, text, image_url, images, likes_count, comments_count, created_at
    """, (user_id, text, image_url, json.dumps(images)))
    post = dict(cur.fetchone())
    if not post.get('images'):
        post['images'] = []
    conn.commit()
    cur.close()
    conn.close()
    conn2 = get_conn()
    cur2 = conn2.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur2.execute(f"SELECT name, initials FROM {SCHEMA}.users WHERE id = %s", (user_id,))
    u = cur2.fetchone()
    cur2.close(); conn2.close()
    if u:
        post['user_name'] = u['name']
        post['user_initials'] = u['initials']
    return post

def create_chat(name, is_group, created_by, is_private=False):
    """Создать новую беседу"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        INSERT INTO {SCHEMA}.chats (name, is_group, created_by, is_private, admin_id)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, name, is_group, is_private, admin_id, avatar_url, created_at
    """, (name, is_group, created_by, is_private, created_by))
    chat = dict(cur.fetchone())
    cur.execute(f"""
        INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES (%s, %s)
    """, (chat['id'], created_by))
    conn.commit()
    cur.close()
    conn.close()
    return chat

def get_chat_members(chat_id):
    """Получить участников беседы"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        SELECT u.id, u.name, u.initials, u.avatar_url, u.login, u.position,
               cm.joined_at
        FROM {SCHEMA}.chat_members cm
        JOIN {SCHEMA}.users u ON u.id = cm.user_id
        WHERE cm.chat_id = %s
        ORDER BY cm.joined_at ASC
    """, (chat_id,))
    members = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in members]

def add_chat_member(chat_id, user_id, admin_id):
    """Добавить участника в приватную беседу (только администратор)"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"SELECT admin_id, is_private FROM {SCHEMA}.chats WHERE id = %s", (chat_id,))
    chat = cur.fetchone()
    if not chat:
        cur.close(); conn.close()
        return None, 'Беседа не найдена'
    if chat['is_private'] and chat['admin_id'] != admin_id:
        cur.close(); conn.close()
        return None, 'Только администратор беседы может добавлять участников'
    cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE login = %s AND status = 'approved'", (user_id,))
    user = cur.fetchone()
    if not user:
        cur.close(); conn.close()
        return None, 'Пользователь с таким логином не найден'
    cur.execute(f"SELECT 1 FROM {SCHEMA}.chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, user['id']))
    if cur.fetchone():
        cur.close(); conn.close()
        return None, 'Пользователь уже в беседе'
    cur.execute(f"INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, user['id']))
    conn.commit()
    cur.close(); conn.close()
    return {'success': True, 'user_id': user['id']}, None

def join_chat(chat_id, user_id):
    """Вступить в открытую беседу"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"SELECT id, is_private FROM {SCHEMA}.chats WHERE id = %s", (chat_id,))
    chat = cur.fetchone()
    if not chat:
        cur.close(); conn.close()
        return None, 'Беседа не найдена'
    if chat['is_private']:
        cur.close(); conn.close()
        return None, 'Это приватная беседа. Попросите администратора добавить вас'
    cur.execute(f"SELECT 1 FROM {SCHEMA}.chat_members WHERE chat_id = %s AND user_id = %s", (chat_id, user_id))
    if cur.fetchone():
        cur.close(); conn.close()
        return None, 'Вы уже в этой беседе'
    cur.execute(f"INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES (%s, %s)", (chat_id, user_id))
    conn.commit()
    cur.close(); conn.close()
    return {'success': True}, None

def get_my_chats(user_id):
    """Получить беседы пользователя"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        SELECT c.id, c.name, c.is_group, c.is_private, c.admin_id, c.avatar_url,
            COALESCE(
                (SELECT m.text FROM {SCHEMA}.messages m
                 WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1), ''
            ) as last_message,
            0 as unread
        FROM {SCHEMA}.chats c
        JOIN {SCHEMA}.chat_members cm ON cm.chat_id = c.id
        WHERE cm.user_id = %s
        ORDER BY c.updated_at DESC
    """, (user_id,))
    chats = cur.fetchall()
    cur.close(); conn.close()
    return [dict(r) for r in chats]

def get_public_chats(user_id):
    """Получить открытые беседы в которых пользователь не состоит"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        SELECT c.id, c.name, c.is_group, c.is_private, c.admin_id, c.avatar_url,
            (SELECT COUNT(*) FROM {SCHEMA}.chat_members cm2 WHERE cm2.chat_id = c.id) as members_count
        FROM {SCHEMA}.chats c
        WHERE c.is_private = false
          AND c.id NOT IN (
              SELECT chat_id FROM {SCHEMA}.chat_members WHERE user_id = %s
          )
        ORDER BY c.created_at DESC
    """, (user_id,))
    chats = cur.fetchall()
    cur.close(); conn.close()
    return [dict(r) for r in chats]

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

def toggle_like(post_id, user_id):
    """Поставить или убрать лайк"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"SELECT id FROM {SCHEMA}.post_likes WHERE post_id = %s AND user_id = %s", (post_id, user_id))
    existing = cur.fetchone()
    if existing:
        cur.execute(f"DELETE FROM {SCHEMA}.post_likes WHERE post_id = %s AND user_id = %s", (post_id, user_id))
        cur.execute(f"UPDATE {SCHEMA}.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = %s RETURNING likes_count", (post_id,))
        liked = False
    else:
        cur.execute(f"INSERT INTO {SCHEMA}.post_likes (post_id, user_id) VALUES (%s, %s)", (post_id, user_id))
        cur.execute(f"UPDATE {SCHEMA}.posts SET likes_count = likes_count + 1 WHERE id = %s RETURNING likes_count", (post_id,))
        liked = True
    row = cur.fetchone()
    conn.commit()
    cur.close(); conn.close()
    return {'liked': liked, 'likes_count': row['likes_count']}

def get_post_likes(post_id, user_id):
    """Проверить, лайкнул ли пользователь пост"""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(f"SELECT 1 FROM {SCHEMA}.post_likes WHERE post_id = %s AND user_id = %s", (post_id, user_id))
    liked = cur.fetchone() is not None
    cur.close(); conn.close()
    return {'liked': liked}

def get_comments(post_id):
    """Получить комментарии к посту"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        SELECT c.id, c.post_id, c.user_id, c.text, c.created_at,
            u.name as user_name, u.initials as user_initials
        FROM {SCHEMA}.post_comments c
        JOIN {SCHEMA}.users u ON u.id = c.user_id
        WHERE c.post_id = %s
        ORDER BY c.created_at ASC
    """, (post_id,))
    comments = cur.fetchall()
    cur.close(); conn.close()
    return [dict(r) for r in comments]

def add_comment(post_id, user_id, text):
    """Добавить комментарий"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        INSERT INTO {SCHEMA}.post_comments (post_id, user_id, text)
        VALUES (%s, %s, %s)
        RETURNING id, post_id, user_id, text, created_at
    """, (post_id, user_id, text))
    comment = dict(cur.fetchone())
    cur.execute(f"UPDATE {SCHEMA}.posts SET comments_count = comments_count + 1 WHERE id = %s RETURNING comments_count", (post_id,))
    row = cur.fetchone()
    comment['comments_count'] = row['comments_count']
    cur.execute(f"SELECT name, initials FROM {SCHEMA}.users WHERE id = %s", (user_id,))
    u = cur.fetchone()
    if u:
        comment['user_name'] = u['name']
        comment['user_initials'] = u['initials']
    conn.commit()
    cur.close(); conn.close()
    return comment

def get_posts():
    """Получить посты"""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(f"""
        SELECT p.id, p.user_id, p.text, p.image_url, p.images, p.likes_count, p.comments_count,
            p.created_at, u.name as user_name, u.initials as user_initials
        FROM {SCHEMA}.posts p
        JOIN {SCHEMA}.users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
    """)
    posts = cur.fetchall()
    cur.close()
    conn.close()
    result = []
    for r in posts:
        d = dict(r)
        if not d.get('images'):
            d['images'] = []
        result.append(d)
    return result

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
        user_id = p.get('user_id')
        if not chat_id:
            return response(400, {'error': 'chat_id required'})
        result = get_messages(int(chat_id), int(user_id) if user_id else None)
        if result is None:
            return response(403, {'error': 'Доступ запрещён: вы не участник этой беседы'})
        return response(200, result)

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
        images_raw = p.get('images', [])
        if isinstance(images_raw, str):
            images_raw = json.loads(images_raw) if images_raw else []
        if not all([chat_id, sender_id]) or (not text and not images_raw):
            return response(400, {'error': 'chat_id, sender_id и text или images required'})
        return response(200, send_message(int(chat_id), int(sender_id), text, images_raw))

    elif action == 'create_post':
        user_id = p.get('user_id')
        text = p.get('text', '')
        images_raw = p.get('images', [])
        if isinstance(images_raw, str):
            images_raw = json.loads(images_raw) if images_raw else []
        if not user_id or (not text and not images_raw):
            return response(400, {'error': 'user_id и text или images required'})
        return response(200, create_post(int(user_id), text, images_raw))

    elif action == 'create_chat':
        name = p.get('name', '')
        is_group = p.get('is_group', 'true')
        is_private = p.get('is_private', 'false')
        if isinstance(is_group, str):
            is_group = is_group.lower() == 'true'
        if isinstance(is_private, str):
            is_private = is_private.lower() == 'true'
        created_by = p.get('created_by', 1)
        if not name:
            return response(400, {'error': 'name required'})
        return response(200, create_chat(name, is_group, int(created_by), is_private))

    elif action == 'get_chat_members':
        chat_id = p.get('chat_id')
        if not chat_id:
            return response(400, {'error': 'chat_id required'})
        return response(200, get_chat_members(int(chat_id)))

    elif action == 'add_chat_member':
        chat_id = p.get('chat_id')
        user_login = p.get('user_login', '').strip()
        admin_id = p.get('admin_id')
        if not all([chat_id, user_login, admin_id]):
            return response(400, {'error': 'chat_id, user_login, admin_id required'})
        result, err = add_chat_member(int(chat_id), user_login, int(admin_id))
        if err:
            return response(400, {'error': err})
        return response(200, result)

    elif action == 'join_chat':
        chat_id = p.get('chat_id')
        user_id = p.get('user_id')
        if not all([chat_id, user_id]):
            return response(400, {'error': 'chat_id, user_id required'})
        result, err = join_chat(int(chat_id), int(user_id))
        if err:
            return response(400, {'error': err})
        return response(200, result)

    elif action == 'my_chats':
        user_id = p.get('user_id')
        if not user_id:
            return response(400, {'error': 'user_id required'})
        return response(200, get_my_chats(int(user_id)))

    elif action == 'public_chats':
        user_id = p.get('user_id', 0)
        return response(200, get_public_chats(int(user_id)))

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

    elif action == 'toggle_like':
        post_id = p.get('post_id')
        user_id = p.get('user_id')
        if not all([post_id, user_id]):
            return response(400, {'error': 'post_id, user_id required'})
        return response(200, toggle_like(int(post_id), int(user_id)))

    elif action == 'get_comments':
        post_id = p.get('post_id')
        if not post_id:
            return response(400, {'error': 'post_id required'})
        return response(200, get_comments(int(post_id)))

    elif action == 'add_comment':
        post_id = p.get('post_id')
        user_id = p.get('user_id')
        text = p.get('text', '').strip()
        if not all([post_id, user_id, text]):
            return response(400, {'error': 'post_id, user_id, text required'})
        return response(200, add_comment(int(post_id), int(user_id), text))

    else:
        return response(200, {'status': 'ok'})