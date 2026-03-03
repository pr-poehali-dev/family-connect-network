const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  getChats: (userId: number) => get({ action: 'chats', user_id: String(userId) }),
  getMessages: (chatId: number, userId: number) =>
    get({ action: 'messages', chat_id: String(chatId), user_id: String(userId) }),
  getUsers: () => get({ action: 'users' }),
  getPosts: () => get({ action: 'posts' }),
  sendMessage: (chatId: number, senderId: number, text: string, images?: string[]) =>
    get({ action: 'send_message', chat_id: String(chatId), sender_id: String(senderId), text, ...(images && images.length > 0 ? { images: JSON.stringify(images) } : {}) }),
  createPost: (userId: number, text: string, images?: string[]) =>
    get({ action: 'create_post', user_id: String(userId), text: text || (images && images.length > 0 ? ' ' : ''), ...(images && images.length > 0 ? { images: JSON.stringify(images) } : {}) }),
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
  toggleLike: (postId: number, userId: number) =>
    get({ action: 'toggle_like', post_id: String(postId), user_id: String(userId) }),
  getComments: (postId: number) =>
    get({ action: 'get_comments', post_id: String(postId) }),
  addComment: (postId: number, userId: number, text: string) =>
    get({ action: 'add_comment', post_id: String(postId), user_id: String(userId), text }),
  deletePost: (postId: number, userId: number) =>
    get({ action: 'delete_post', post_id: String(postId), user_id: String(userId) }),
  setUserRole: (userId: number, role: 'admin' | 'user') =>
    get({ action: 'set_role', user_id: String(userId), role }),
};

export default api;