import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import HomeTab from '@/components/HomeTab';
import ChatsTab from '@/components/ChatsTab';
import ProfileTab from '@/components/ProfileTab';
import AdminTab from '@/components/AdminTab';

type User = {
  id: number;
  name: string;
  avatar: string;
  initials: string;
  status: 'approved' | 'pending';
  role: 'admin' | 'user';
};

type Message = {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
  hasImage?: boolean;
};

type Chat = {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  isGroup: boolean;
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

export default function Index() {
  const [currentUser] = useState<User>({
    id: 1,
    name: 'Владимир',
    avatar: '',
    initials: 'ВП',
    status: 'approved',
    role: 'admin'
  });

  const [activeTab, setActiveTab] = useState('home');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [siteName, setSiteName] = useState('Альфа Семья');
  
  const [users] = useState<User[]>([
    { id: 1, name: 'Владимир', avatar: '', initials: 'ВП', status: 'approved', role: 'admin' },
    { id: 2, name: 'Елена', avatar: '', initials: 'ЕС', status: 'approved', role: 'user' },
    { id: 3, name: 'Александр', avatar: '', initials: 'АК', status: 'pending', role: 'user' },
    { id: 4, name: 'Мария', avatar: '', initials: 'МВ', status: 'pending', role: 'user' },
  ]);

  const [chats, setChats] = useState<Chat[]>([
    { id: 1, name: 'Общий чат', avatar: '', lastMessage: 'Привет всем!', unread: 3, isGroup: true },
    { id: 2, name: 'Родители', avatar: '', lastMessage: 'Когда приедете?', unread: 1, isGroup: true },
    { id: 3, name: 'Елена', avatar: '', lastMessage: 'Спасибо за фото!', unread: 0, isGroup: false },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, senderId: 2, text: 'Привет! Как дела?', timestamp: '10:30' },
    { id: 2, senderId: 1, text: 'Отлично! А у тебя?', timestamp: '10:32' },
    { id: 3, senderId: 2, text: 'Тоже хорошо! Смотри какое фото нашла', timestamp: '10:33', hasImage: true },
  ]);

  const handleCreateChat = (chatName: string, isGroup: boolean) => {
    const newChat: Chat = {
      id: chats.length + 1,
      name: chatName,
      avatar: '',
      lastMessage: 'Новая беседа создана',
      unread: 0,
      isGroup: isGroup
    };
    setChats([...chats, newChat]);
  };

  const handleSendMessage = (text: string) => {
    if (!selectedChat || !text.trim()) return;
    
    const newMessage: Message = {
      id: messages.length + 1,
      senderId: currentUser.id,
      text: text,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMessage]);
    
    setChats(chats.map(chat => 
      chat.id === selectedChat.id 
        ? { ...chat, lastMessage: text }
        : chat
    ));
  };

  const handleChangeChatAvatar = (chatId: number, avatarUrl: string) => {
    setChats(chats.map(chat =>
      chat.id === chatId ? { ...chat, avatar: avatarUrl } : chat
    ));
    if (selectedChat?.id === chatId) {
      setSelectedChat({ ...selectedChat, avatar: avatarUrl });
    }
  };

  const handleOpenChat = (chat: Chat) => {
    setSelectedChat(chat);
    setActiveTab('chats');
  };

  const [posts] = useState<Post[]>([
    {
      id: 1,
      userId: 2,
      text: 'Какой прекрасный день! Были всей семьей на пикнике 🌳',
      image: '🏞️',
      timestamp: '2 часа назад',
      likes: 12,
      comments: 5
    },
    {
      id: 2,
      userId: 4,
      text: 'Поздравляю всех с началом лета! Желаю тепла и солнца ☀️',
      timestamp: '5 часов назад',
      likes: 8,
      comments: 3
    },
  ]);

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-primary shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded flex items-center justify-center">
                <img src="https://cdn.poehali.dev/projects/d335f394-a349-4793-a473-36c20b52466b/bucket/5b3c7a9d-3f2b-484f-a3fe-8ba8195d4e94.png" alt="logo" className="w-7 h-7 object-contain" />
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

          <HomeTab posts={posts} users={users} />

          <ChatsTab 
            chats={chats}
            messages={messages}
            users={users}
            currentUser={currentUser}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            onCreateChat={handleCreateChat}
            onSendMessage={handleSendMessage}
            onChangeChatAvatar={handleChangeChatAvatar}
          />

          <TabsContent value="messages" className="animate-fade-in">
            <Card className="border-2 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-secondary/30 to-primary/30">
                <CardTitle>Личные сообщения</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {chats.filter(c => !c.isGroup).map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleOpenChat(chat)}
                      className="w-full p-4 rounded-xl bg-muted hover:bg-muted/70 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-primary">
                          <AvatarFallback className="bg-secondary">{chat.name[0]}</AvatarFallback>
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
              </CardContent>
            </Card>
          </TabsContent>

          <ProfileTab currentUser={currentUser} />

          {currentUser.role === 'admin' && (
            <AdminTab 
              siteName={siteName}
              setSiteName={setSiteName}
              pendingUsers={pendingUsers}
              approvedUsers={approvedUsers}
            />
          )}
        </Tabs>
      </div>
    </div>
  );
}