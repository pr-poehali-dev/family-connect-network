const API_URL = 'https://functions.poehali.dev/706339d3-e113-4f57-95bb-145dbb1414eb';

async function get(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  try {
    const res = await fetch(`${API_URL}?${query}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Ошибка сервера: ${res.status}`);
    return data;
  } catch (e) {
    if (e instanceof Error && !e.message.includes('fetch')) throw e;
    throw new Error('Ошибка соединения с сервером. Попробуйте ещё раз.');
  }
}

export const api = {
  register: (name: string, password: string, phone: string, login: string) =>
    get({ action: 'register', name, password, phone, login }),
  login: (identifier: string, password: string) =>
    get({ action: 'login', identifier, password }),
  approveUser: (userId: number) =>
    get({ action: 'approve_user', user_id: String(userId) }),
  rejectUser: (userId: number) =>
    get({ action: 'reject_user', user_id: String(userId) }),
  getChats: () => get({ action: 'chats' }),
  getMessages: (chatId: number) =>
    get({ action: 'messages', chat_id: String(chatId) }),
  getUsers: () => get({ action: 'users' }),
  getPosts: () => get({ action: 'posts' }),
  sendMessage: (chatId: number, senderId: number, text: string) =>
    get({ action: 'send_message', chat_id: String(chatId), sender_id: String(senderId), text }),
  createChat: (name: string, isGroup: boolean, createdBy: number) =>
    get({ action: 'create_chat', name, is_group: String(isGroup), created_by: String(createdBy) }),
  updateChatAvatar: (chatId: number, avatarUrl: string) =>
    get({ action: 'update_chat_avatar', chat_id: String(chatId), avatar_url: avatarUrl }),
  updateProfile: (userId: number, name: string, bio: string, position: string) =>
    get({ action: 'update_profile', user_id: String(userId), name, bio, position }),
};

export default api;
