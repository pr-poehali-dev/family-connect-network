import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import HomeTab from '@/components/HomeTab';
import ChatsTab from '@/components/ChatsTab';
import ProfileTab from '@/components/ProfileTab';
import AdminTab from '@/components/AdminTab';
import AuthPage from '@/components/AuthPage';
import PendingScreen from '@/components/PendingScreen';
import api from '@/lib/api';

type User = {
  id: number;
  name: string;
  avatar_url: string;
  initials: string;
  status: string;
  role: 'admin' | 'user';
  position?: string;
  bio?: string;
};

type DbMessage = {
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

type Message = {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
  hasImage?: boolean;
  imageUrl?: string;
  images?: string[];
};

type DbChat = {
  id: number;
  name: string;
  is_group: boolean;
  avatar_url: string;
  last_message: string;
  unread: number;
};

type Chat = {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  isGroup: boolean;
};

type DbPost = {
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

type Post = {
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

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(dateStr: string) {
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

function mapChat(c: DbChat): Chat {
  return { id: c.id, name: c.name, avatar: c.avatar_url || '', lastMessage: c.last_message || '', unread: c.unread, isGroup: c.is_group };
}
function mapMessage(m: DbMessage): Message {
  const imgs: string[] = Array.isArray((m as Record<string, unknown>).images) ? (m as Record<string, unknown>).images as string[] : [];
  return { id: m.id, senderId: m.sender_id, text: m.text, timestamp: formatTime(m.created_at), hasImage: m.has_image, imageUrl: m.image_url || undefined, images: imgs.length > 0 ? imgs : undefined };
}
function mapPost(p: DbPost): Post {
  const imgs: string[] = Array.isArray((p as Record<string, unknown>).images) ? (p as Record<string, unknown>).images as string[] : [];
  return { id: p.id, userId: p.user_id, text: p.text, image: p.image_url || undefined, images: imgs.length > 0 ? imgs : undefined, timestamp: timeAgo(p.created_at), likes: p.likes_count, comments: p.comments_count };
}

function AlphaLogo() {
  return (
    <div className="w-10 h-10 bg-white rounded-md grid place-items-center relative overflow-hidden">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="relative z-10">
        <path d="M12 3L4 21h3.5l1.5-3.5h6l1.5 3.5H20L12 3zm0 5.5L14.5 15h-5L12 8.5z" fill="hsl(0, 89%, 40%)" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
    </div>
  );
}

export default function Index() {
  const [authedUser, setAuthedUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('alfa_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Если id=0 — это старый формат admin, сбрасываем (нужен реальный id из БД)
      if (!parsed.id || parsed.id === 0) {
        localStorage.removeItem('alfa_user');
        return null;
      }
      return parsed;
    } catch { return null; }
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [siteName, setSiteName] = useState('Альфа Семья');

  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const handleAuth = (user: Record<string, unknown>) => {
    const u = user as unknown as User;
    setAuthedUser(u);
    localStorage.setItem('alfa_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setAuthedUser(null);
    setCurrentUser(null);
    localStorage.removeItem('alfa_user');
  };

  useEffect(() => {
    if (!authedUser) { setLoading(false); return; }
    async function load() {
      try {
        const [dbUsers, dbChats, dbPosts] = await Promise.all([
          api.getUsers(),
          api.getChats(authedUser.id),
          api.getPosts(),
        ]);
        const mappedUsers = dbUsers.map((u: Record<string, unknown>) => ({
          id: u.id as number,
          name: u.name as string,
          avatar_url: (u.avatar_url as string) || '',
          initials: u.initials as string,
          status: u.status as string,
          role: u.role as 'admin' | 'user',
          position: (u.position as string) || '',
          bio: (u.bio as string) || '',
        }));
        setUsers(mappedUsers);
        setChats(dbChats.map(mapChat));
        setPosts(dbPosts.map(mapPost));
        const freshUser = mappedUsers.find((u: User) => u.id === authedUser.id);
        if (freshUser) {
          setCurrentUser(freshUser);
          setAuthedUser(freshUser);
          localStorage.setItem('alfa_user', JSON.stringify(freshUser));
        } else {
          setCurrentUser(authedUser);
        }
      } catch (e) {
        console.error('Failed to load data:', e);
        setCurrentUser(authedUser);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [authedUser?.id]);

  useEffect(() => {
    if (!selectedChat || !currentUser) return;
    api.getMessages(selectedChat.id, currentUser.id).then((dbMsgs: DbMessage[]) => {
      setMessages(dbMsgs.map(mapMessage));
    }).catch(console.error);
  }, [selectedChat?.id]);

  const handleCreateChat = useCallback(async (chatName: string, isGroup: boolean, isPrivate: boolean = false) => {
    if (!currentUser) return;
    try {
      const dbChat = await api.createChat(chatName, isGroup, currentUser.id, isPrivate);
      const newChat: Chat = { id: dbChat.id, name: dbChat.name, avatar: dbChat.avatar_url || '', lastMessage: '', unread: 0, isGroup: dbChat.is_group };
      setChats(prev => [...prev, newChat]);
    } catch (e) { console.error(e); }
  }, [currentUser?.id]);

  const handleSendMessage = useCallback(async (text: string, images?: string[]) => {
    if (!selectedChat || (!text.trim() && (!images || images.length === 0)) || !currentUser) return;
    try {
      const dbMsg = await api.sendMessage(selectedChat.id, currentUser.id, text, images);
      const msgImgs: string[] = Array.isArray((dbMsg as Record<string, unknown>).images) ? (dbMsg as Record<string, unknown>).images as string[] : [];
      setMessages(prev => [...prev, { id: dbMsg.id, senderId: dbMsg.sender_id, text: dbMsg.text, timestamp: formatTime(dbMsg.created_at), hasImage: dbMsg.has_image, imageUrl: dbMsg.image_url || undefined, images: msgImgs.length > 0 ? msgImgs : undefined }]);
      setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, lastMessage: text || '📷 Фото' } : c));
    } catch (e) { console.error(e); }
  }, [selectedChat, currentUser?.id]);

  const handleCreatePost = useCallback(async (text: string, images?: string[]) => {
    if (!currentUser || !currentUser.id) throw new Error('Не авторизован');
    const dbPost = await api.createPost(currentUser.id, text, images);
    setPosts(prev => [mapPost(dbPost), ...prev]);
  }, [currentUser?.id]);

  const handleToggleLike = useCallback(async (postId: number) => {
    if (!currentUser) return;
    try {
      const result = await api.toggleLike(postId, currentUser.id);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: result.likes_count, likedByMe: result.liked } : p));
    } catch (e) { console.error(e); }
  }, [currentUser?.id]);

  const handleAddComment = useCallback(async (postId: number, text: string) => {
    if (!currentUser) return;
    try {
      const comment = await api.addComment(postId, currentUser.id, text);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: comment.comments_count } : p));
      return comment;
    } catch (e) { console.error(e); return null; }
  }, [currentUser?.id]);

  const handleDeletePost = useCallback(async (postId: number) => {
    if (!currentUser) return;
    await api.deletePost(postId, currentUser.id);
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, [currentUser?.id]);

  const handleChangeChatAvatar = useCallback(async (chatId: number, avatarUrl: string) => {
    try {
      await api.updateChatAvatar(chatId, avatarUrl);
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, avatar: avatarUrl } : c));
      setSelectedChat(prev => prev?.id === chatId ? { ...prev, avatar: avatarUrl } : prev);
    } catch (e) { console.error(e); }
  }, []);

  const handleOpenChat = useCallback((chat: Chat) => {
    setSelectedChat(chat);
    setActiveTab('chats');
  }, []);

  const handleUserApproved = (userId: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'approved' } : u));
  };

  const handleUserRejected = (userId: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'rejected' } : u));
  };

  if (!authedUser) {
    return <AuthPage onAuth={handleAuth} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 bg-primary rounded-lg grid place-items-center mx-auto mb-4 shadow-sm relative overflow-hidden">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="relative z-10">
              <path d="M12 3L4 21h3.5l1.5-3.5h6l1.5 3.5H20L12 3zm0 5.5L14.5 15h-5L12 8.5z" fill="white" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />
          </div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (currentUser && currentUser.status === 'pending') {
    return <PendingScreen userName={currentUser.name} onLogout={handleLogout} />;
  }

  if (!currentUser) return null;

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');

  const usersForComponents = users.map(u => ({
    id: u.id, name: u.name, avatar: u.avatar_url, initials: u.initials, status: u.status as 'approved' | 'pending', role: u.role
  }));
  const currentUserForComponents = {
    id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar_url, initials: currentUser.initials, status: currentUser.status as 'approved' | 'pending', role: currentUser.role, position: currentUser.position || '', bio: currentUser.bio || ''
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-primary shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlphaLogo />
              <h1 className="text-2xl font-bold text-white tracking-tight">{siteName}</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="w-9 h-9 border-2 border-white/40">
                  <AvatarFallback className="bg-white/20 text-white text-sm font-medium">{currentUser.initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-white hidden sm:inline">{currentUser.name}</span>
              </div>
              <Button size="icon" variant="ghost" onClick={handleLogout} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full">
                <Icon name="LogOut" size={18} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid bg-white p-1 rounded-lg border border-border shadow-sm">
            <TabsTrigger value="home" className="rounded-md gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
              <Icon name="Home" size={18} />
              <span className="hidden sm:inline">Главная</span>
            </TabsTrigger>
            <TabsTrigger value="chats" className="rounded-md gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
              <Icon name="MessageCircle" size={18} />
              <span className="hidden sm:inline">Беседы</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-md gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
              <Icon name="Send" size={18} />
              <span className="hidden sm:inline">Сообщения</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-md gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
              <Icon name="User" size={18} />
              <span className="hidden sm:inline">Профиль</span>
            </TabsTrigger>
            {currentUser.role === 'admin' && (
              <TabsTrigger value="admin" className="rounded-md gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Icon name="Shield" size={18} />
                <span className="hidden sm:inline">Админ</span>
              </TabsTrigger>
            )}
          </TabsList>

          <HomeTab
            posts={posts}
            users={usersForComponents}
            currentUserId={currentUser?.id}
            currentUserRole={currentUser?.role}
            onCreatePost={handleCreatePost}
            onToggleLike={handleToggleLike}
            onAddComment={handleAddComment}
            onDeletePost={handleDeletePost}
          />

          <ChatsTab
            chats={chats}
            messages={messages}
            users={usersForComponents}
            currentUser={currentUserForComponents}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            onCreateChat={handleCreateChat}
            onSendMessage={handleSendMessage}
            onChangeChatAvatar={handleChangeChatAvatar}
          />

          <TabsContent value="messages" className="animate-fade-in">
            <Card className="border rounded-lg overflow-hidden">
              <CardHeader className="bg-primary text-white">
                <CardTitle>Личные сообщения</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {chats.filter(c => !c.isGroup).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="MessageCircle" size={40} className="mx-auto mb-3 text-primary/30" />
                    <p>Нет личных сообщений</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chats.filter(c => !c.isGroup).map((chat) => (
                      <button key={chat.id} onClick={() => handleOpenChat(chat)} className="w-full p-4 rounded-lg bg-muted hover:bg-primary/5 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{chat.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{chat.name}</p>
                            <p className="text-sm text-muted-foreground">{chat.lastMessage}</p>
                          </div>
                          <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <ProfileTab
            currentUser={currentUserForComponents}
            onProfileUpdate={(name, initials, position, bio) => {
              setCurrentUser(prev => prev ? { ...prev, name, initials, position, bio } : prev);
              setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, name, initials, position, bio } : u));
              localStorage.setItem('alfa_user', JSON.stringify({ ...authedUser, name, initials, position, bio }));
            }}
          />

          {currentUser.role === 'admin' && (
            <AdminTab
              siteName={siteName}
              setSiteName={setSiteName}
              pendingUsers={pendingUsers.map(u => ({ id: u.id, name: u.name, avatar: u.avatar_url, initials: u.initials, status: u.status as 'approved' | 'pending', role: u.role }))}
              approvedUsers={approvedUsers.map(u => ({ id: u.id, name: u.name, avatar: u.avatar_url, initials: u.initials, status: u.status as 'approved' | 'pending', role: u.role }))}
              onUserApproved={handleUserApproved}
              onUserRejected={handleUserRejected}
            />
          )}
        </Tabs>
      </div>
    </div>
  );
}