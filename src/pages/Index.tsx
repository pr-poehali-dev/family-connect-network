import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import HomeTab from '@/components/HomeTab';
import ChatsTab from '@/components/ChatsTab';
import ProfileTab from '@/components/ProfileTab';
import AdminTab from '@/components/AdminTab';
import api from '@/lib/api';

type User = {
  id: number;
  name: string;
  avatar_url: string;
  initials: string;
  status: 'approved' | 'pending';
  role: 'admin' | 'user';
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
  timestamp: string;
  likes: number;
  comments: number;
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
  return { id: m.id, senderId: m.sender_id, text: m.text, timestamp: formatTime(m.created_at), hasImage: m.has_image };
}

function mapPost(p: DbPost): Post {
  return { id: p.id, userId: p.user_id, text: p.text, image: p.image_url || undefined, timestamp: timeAgo(p.created_at), likes: p.likes_count, comments: p.comments_count };
}

function mapUser(u: { id: number; name: string; avatar_url: string | null; initials: string; status: string; role: string }): User {
  return { id: u.id, name: u.name, avatar_url: u.avatar_url || '', initials: u.initials, status: u.status as 'approved' | 'pending', role: u.role as 'admin' | 'user' };
}

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 1, name: 'Администратор', avatar_url: '', initials: 'АД', status: 'approved', role: 'admin'
  });

  const [activeTab, setActiveTab] = useState('home');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [siteName, setSiteName] = useState('Альфа Семья');

  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dbUsers, dbChats, dbPosts] = await Promise.all([
          api.getUsers(),
          api.getChats(),
          api.getPosts(),
        ]);
        const mappedUsers = dbUsers.map(mapUser);
        setUsers(mappedUsers);
        setChats(dbChats.map(mapChat));
        setPosts(dbPosts.map(mapPost));
        const admin = mappedUsers.find((u: User) => u.role === 'admin');
        if (admin) setCurrentUser(admin);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedChat) return;
    api.getMessages(selectedChat.id).then((dbMsgs: DbMessage[]) => {
      setMessages(dbMsgs.map(mapMessage));
    }).catch(console.error);
  }, [selectedChat?.id]);

  const handleCreateChat = useCallback(async (chatName: string, isGroup: boolean) => {
    try {
      const dbChat = await api.createChat(chatName, isGroup, currentUser.id);
      const newChat: Chat = {
        id: dbChat.id,
        name: dbChat.name,
        avatar: dbChat.avatar_url || '',
        lastMessage: '',
        unread: 0,
        isGroup: dbChat.is_group
      };
      setChats(prev => [...prev, newChat]);
    } catch (e) {
      console.error('Failed to create chat:', e);
    }
  }, [currentUser.id]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!selectedChat || !text.trim()) return;
    try {
      const dbMsg = await api.sendMessage(selectedChat.id, currentUser.id, text);
      const newMsg: Message = {
        id: dbMsg.id,
        senderId: dbMsg.sender_id,
        text: dbMsg.text,
        timestamp: formatTime(dbMsg.created_at),
      };
      setMessages(prev => [...prev, newMsg]);
      setChats(prev => prev.map(c =>
        c.id === selectedChat.id ? { ...c, lastMessage: text } : c
      ));
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  }, [selectedChat, currentUser.id]);

  const handleChangeChatAvatar = useCallback(async (chatId: number, avatarUrl: string) => {
    try {
      await api.updateChatAvatar(chatId, avatarUrl);
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, avatar: avatarUrl } : c));
      setSelectedChat(prev => prev?.id === chatId ? { ...prev, avatar: avatarUrl } : prev);
    } catch (e) {
      console.error('Failed to update avatar:', e);
    }
  }, []);

  const handleOpenChat = useCallback((chat: Chat) => {
    setSelectedChat(chat);
    setActiveTab('chats');
  }, []);

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');

  const usersForComponents = users.map(u => ({
    id: u.id, name: u.name, avatar: u.avatar_url, initials: u.initials, status: u.status, role: u.role
  }));

  const currentUserForComponents = {
    id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar_url, initials: currentUser.initials, status: currentUser.status, role: currentUser.role
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center mx-auto mb-4 shadow-sm border border-border overflow-hidden">
            <img src="https://cdn.poehali.dev/projects/d335f394-a349-4793-a473-36c20b52466b/bucket/8de415f5-89e5-465b-ae80-a322cd985a70.png" alt="А" className="w-9 h-9 object-contain" />
          </div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-primary shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center overflow-hidden">
                <img src="https://cdn.poehali.dev/projects/d335f394-a349-4793-a473-36c20b52466b/bucket/8de415f5-89e5-465b-ae80-a322cd985a70.png" alt="А" className="w-8 h-8 object-contain" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {siteName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="w-9 h-9 border-2 border-white/40">
                <AvatarFallback className="bg-white/20 text-white text-sm font-medium">{currentUser.initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white hidden sm:inline">{currentUser.name}</span>
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

          <HomeTab posts={posts} users={usersForComponents} />

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
                      <button
                        key={chat.id}
                        onClick={() => handleOpenChat(chat)}
                        className="w-full p-4 rounded-lg bg-muted hover:bg-primary/5 transition-colors text-left"
                      >
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
            onProfileUpdate={(name, initials) => {
              setCurrentUser(prev => ({ ...prev, name, initials }));
              setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, name, initials } : u));
            }}
          />

          {currentUser.role === 'admin' && (
            <AdminTab
              siteName={siteName}
              setSiteName={setSiteName}
              pendingUsers={pendingUsers.map(u => ({ id: u.id, name: u.name, avatar: u.avatar_url, initials: u.initials, status: u.status, role: u.role }))}
              approvedUsers={approvedUsers.map(u => ({ id: u.id, name: u.name, avatar: u.avatar_url, initials: u.initials, status: u.status, role: u.role }))}
            />
          )}
        </Tabs>
      </div>
    </div>
  );
}