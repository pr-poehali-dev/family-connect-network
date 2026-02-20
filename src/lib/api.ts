const API_URL = 'https://functions.poehali.dev/706339d3-e113-4f57-95bb-145dbb1414eb';

async function request(action: string, params?: Record<string, string>) {
  const query = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${API_URL}?${query}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error: ${res.status}`);
  return data;
}

async function post(action: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_URL}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error: ${res.status}`);
  return data;
}

export const api = {
  register: (name: string, password: string, phone: string, login: string) =>
    post('register', { name, password, phone, login }),
  login: (identifier: string, password: string) =>
    post('login', { identifier, password }),
  approveUser: (userId: number) =>
    post('approve_user', { user_id: userId }),
  rejectUser: (userId: number) =>
    post('reject_user', { user_id: userId }),
  getChats: () => request('chats'),
  getMessages: (chatId: number) => request('messages', { chat_id: String(chatId) }),
  getUsers: () => request('users'),
  getPosts: () => request('posts'),
  sendMessage: (chatId: number, senderId: number, text: string) =>
    post('send_message', { chat_id: chatId, sender_id: senderId, text }),
  createChat: (name: string, isGroup: boolean, createdBy: number) =>
    post('create_chat', { name, is_group: isGroup, created_by: createdBy }),
  updateChatAvatar: (chatId: number, avatarUrl: string) =>
    post('update_chat_avatar', { chat_id: chatId, avatar_url: avatarUrl }),
  updateProfile: (userId: number, name: string, bio: string, position: string) =>
    post('update_profile', { user_id: userId, name, bio, position }),
};

export default api;
