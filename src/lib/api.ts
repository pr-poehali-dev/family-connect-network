const API_URL = 'https://functions.poehali.dev/706339d3-e113-4f57-95bb-145dbb1414eb';

async function request(action: string, params?: Record<string, string>) {
  const query = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${API_URL}?${query}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post(action: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_URL}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
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
  updateProfile: (userId: number, name: string, bio: string) =>
    post('update_profile', { user_id: userId, name, bio }),
};

export default api;