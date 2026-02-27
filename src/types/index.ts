export type User = {
  id: number;
  name: string;
  avatar_url: string;
  initials: string;
  status: string;
  role: 'admin' | 'user';
  position?: string;
  bio?: string;
};

export type DbMessage = {
  id: number;
  chat_id: number;
  sender_id: number;
  text: string;
  has_image: boolean;
  image_url: string;
  created_at: string;
  sender_name: string;
  sender_initials: string;
};

export type Message = {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
  hasImage?: boolean;
  imageUrl?: string;
  images?: string[];
};

export type DbChat = {
  id: number;
  name: string;
  is_group: boolean;
  avatar_url: string;
  last_message: string;
  unread: number;
};

export type Chat = {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  isGroup: boolean;
};

export type DbPost = {
  id: number;
  user_id: number;
  text: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_name: string;
  user_initials: string;
};

export type Post = {
  id: number;
  userId: number;
  text: string;
  image?: string;
  images?: string[];
  timestamp: string;
  likes: number;
  comments: number;
  likedByMe?: boolean;
};

export function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(dateStr: string) {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = Math.floor((now - d) / 60000);
  if (diff < 1) return 'только что';
  if (diff < 60) return `${diff} мин. назад`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн. назад`;
}

export function mapChat(c: DbChat): Chat {
  return { id: c.id, name: c.name, avatar: c.avatar_url || '', lastMessage: c.last_message || '', unread: c.unread, isGroup: c.is_group };
}

export function mapMessage(m: DbMessage): Message {
  const imgs: string[] = Array.isArray((m as Record<string, unknown>).images) ? (m as Record<string, unknown>).images as string[] : [];
  return { id: m.id, senderId: m.sender_id, text: m.text, timestamp: formatTime(m.created_at), hasImage: m.has_image, imageUrl: m.image_url || undefined, images: imgs.length > 0 ? imgs : undefined };
}

export function mapPost(p: DbPost): Post {
  const imgs: string[] = Array.isArray((p as Record<string, unknown>).images) ? (p as Record<string, unknown>).images as string[] : [];
  return { id: p.id, userId: p.user_id, text: p.text, image: p.image_url || undefined, images: imgs.length > 0 ? imgs : undefined, timestamp: timeAgo(p.created_at), likes: p.likes_count, comments: p.comments_count };
}
