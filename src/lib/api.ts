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
  sendMessage: (chatId: number, senderId: number, text: string, imageUrl?: string) =>
    get({ action: 'send_message', chat_id: String(chatId), sender_id: String(senderId), text, ...(imageUrl ? { image_url: imageUrl } : {}) }),
  createPost: (userId: number, text: string, imageUrl?: string) =>
    get({ action: 'create_post', user_id: String(userId), text, ...(imageUrl ? { image_url: imageUrl } : {}) }),
  createChat: (name: string, isGroup: boolean, createdBy: number, isPrivate: boolean = false) =>
    get({ action: 'create_chat', name, is_group: String(isGroup), created_by: String(createdBy), is_private: String(isPrivate) }),
  updateChatAvatar: (chatId: number, avatarUrl: string) =>
    get({ action: 'update_chat_avatar', chat_id: String(chatId), avatar_url: avatarUrl }),
  getMyChats: (userId: number) =>
    get({ action: 'my_chats', user_id: String(userId) }),
  getPublicChats: (userId: number) =>
    get({ action: 'public_chats', user_id: String(userId) }),
  getChatMembers: (chatId: number) =>
    get({ action: 'get_chat_members', chat_id: String(chatId) }),
  addChatMember: (chatId: number, userLogin: string, adminId: number) =>
    get({ action: 'add_chat_member', chat_id: String(chatId), user_login: userLogin, admin_id: String(adminId) }),
  joinChat: (chatId: number, userId: number) =>
    get({ action: 'join_chat', chat_id: String(chatId), user_id: String(userId) }),
  updateProfile: (userId: number, name: string, bio: string, position: string) =>
    get({ action: 'update_profile', user_id: String(userId), name, bio, position }),
};

export default api;