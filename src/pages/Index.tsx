import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [siteName, setSiteName] = useState('Наша Семья');
  
  const [users] = useState<User[]>([
    { id: 1, name: 'Владимир', avatar: '', initials: 'ВП', status: 'approved', role: 'admin' },
    { id: 2, name: 'Елена', avatar: '', initials: 'ЕС', status: 'approved', role: 'user' },
    { id: 3, name: 'Александр', avatar: '', initials: 'АК', status: 'pending', role: 'user' },
    { id: 4, name: 'Мария', avatar: '', initials: 'МВ', status: 'pending', role: 'user' },
  ]);

  const [chats] = useState<Chat[]>([
    { id: 1, name: 'Общий чат', avatar: '', lastMessage: 'Привет всем!', unread: 3, isGroup: true },
    { id: 2, name: 'Родители', avatar: '', lastMessage: 'Когда приедете?', unread: 1, isGroup: true },
    { id: 3, name: 'Елена', avatar: '', lastMessage: 'Спасибо за фото!', unread: 0, isGroup: false },
  ]);

  const [messages] = useState<Message[]>([
    { id: 1, senderId: 2, text: 'Привет! Как дела?', timestamp: '10:30' },
    { id: 2, senderId: 1, text: 'Отлично! А у тебя?', timestamp: '10:32' },
    { id: 3, senderId: 2, text: 'Тоже хорошо! Смотри какое фото нашла', timestamp: '10:33', hasImage: true },
  ]);

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
      <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Icon name="Heart" size={20} className="text-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {siteName}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="w-9 h-9 border-2 border-primary">
                <AvatarFallback className="bg-secondary text-sm font-medium">{currentUser.initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">{currentUser.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid bg-muted/50 p-1 rounded-2xl">
            <TabsTrigger value="home" className="rounded-xl gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Icon name="Home" size={18} />
              <span className="hidden sm:inline">Главная</span>
            </TabsTrigger>
            <TabsTrigger value="chats" className="rounded-xl gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Icon name="MessageCircle" size={18} />
              <span className="hidden sm:inline">Беседы</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="rounded-xl gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Icon name="Send" size={18} />
              <span className="hidden sm:inline">Сообщения</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Icon name="User" size={18} />
              <span className="hidden sm:inline">Профиль</span>
            </TabsTrigger>
            {currentUser.role === 'admin' && (
              <TabsTrigger value="admin" className="rounded-xl gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Icon name="Shield" size={18} />
                <span className="hidden sm:inline">Админ</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="home" className="space-y-4 animate-fade-in">
            <Card className="border-2 hover:shadow-lg transition-shadow duration-300 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/30 to-secondary/30">
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Pencil" size={20} />
                  Создать публикацию
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <Textarea 
                  placeholder="Чем хотите поделиться с семьей?" 
                  className="mb-4 min-h-24 resize-none rounded-xl border-2 focus:border-primary transition-colors"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" className="rounded-full gap-2 hover:scale-105 transition-transform duration-200">
                    <Icon name="Image" size={16} />
                    Фото
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full gap-2 hover:scale-105 transition-transform duration-200">
                    <Icon name="Video" size={16} />
                    Видео
                  </Button>
                  <Button className="ml-auto rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity">
                    Опубликовать
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {posts.map((post) => {
                const author = users.find(u => u.id === post.userId);
                return (
                  <Card key={post.id} className="border-2 hover:shadow-lg transition-shadow duration-300 rounded-2xl overflow-hidden animate-scale-in">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-primary">
                          <AvatarFallback className="bg-secondary font-medium">{author?.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{author?.name}</p>
                          <p className="text-xs text-muted-foreground">{post.timestamp}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-foreground leading-relaxed">{post.text}</p>
                      {post.image && (
                        <div className="bg-muted rounded-xl p-12 text-center text-6xl">
                          {post.image}
                        </div>
                      )}
                      <Separator />
                      <div className="flex gap-4">
                        <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-primary/20">
                          <Icon name="Heart" size={18} />
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-secondary/20">
                          <Icon name="MessageCircle" size={18} />
                          {post.comments}
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-accent/20">
                          <Icon name="Share2" size={18} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="chats" className="animate-fade-in">
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-1 border-2 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/30 to-accent/30">
                  <CardTitle className="flex items-center justify-between">
                    <span>Все беседы</span>
                    <Button size="icon" variant="ghost" className="rounded-full hover:bg-card/50">
                      <Icon name="Plus" size={20} />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="h-[500px]">
                  <CardContent className="p-2">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`w-full p-4 rounded-xl mb-2 transition-all hover:bg-muted ${
                          selectedChat?.id === chat.id ? 'bg-primary/20 shadow-md' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-secondary">
                            <AvatarFallback className="bg-accent">
                              {chat.isGroup ? <Icon name="Users" size={20} /> : chat.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">{chat.name}</p>
                              {chat.unread > 0 && (
                                <Badge className="bg-destructive text-destructive-foreground rounded-full">
                                  {chat.unread}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </ScrollArea>
              </Card>

              <Card className="lg:col-span-2 border-2 rounded-2xl overflow-hidden">
                {selectedChat ? (
                  <>
                    <CardHeader className="bg-gradient-to-r from-secondary/30 to-accent/30">
                      <CardTitle className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-primary">
                          <AvatarFallback className="bg-accent">
                            {selectedChat.isGroup ? <Icon name="Users" size={20} /> : selectedChat.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {selectedChat.name}
                      </CardTitle>
                    </CardHeader>
                    <ScrollArea className="h-[400px] p-4">
                      <div className="space-y-4">
                        {messages.map((msg) => {
                          const isOwn = msg.senderId === currentUser.id;
                          const sender = users.find(u => u.id === msg.senderId);
                          return (
                            <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                              <Avatar className="w-8 h-8 border-2 border-secondary">
                                <AvatarFallback className="bg-accent text-xs">{sender?.initials}</AvatarFallback>
                              </Avatar>
                              <div className={`max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
                                <div
                                  className={`rounded-2xl p-3 ${
                                    isOwn
                                      ? 'bg-gradient-to-r from-primary to-secondary text-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <p>{msg.text}</p>
                                  {msg.hasImage && (
                                    <div className="mt-2 bg-background/50 rounded-xl p-8 text-center text-3xl">
                                      📷
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 px-2">{msg.timestamp}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                    <CardContent className="pt-4 border-t">
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" className="rounded-full hover:scale-105 transition-transform duration-200">
                          <Icon name="Paperclip" size={20} />
                        </Button>
                        <Input
                          placeholder="Написать сообщение..."
                          className="flex-1 rounded-full border-2"
                        />
                        <Button size="icon" className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                          <Icon name="Send" size={20} />
                        </Button>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="h-[500px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Icon name="MessageCircle" size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Выберите беседу для начала общения</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

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

          <TabsContent value="profile" className="animate-fade-in">
            <Card className="border-2 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-accent/30 to-primary/30">
                <CardTitle>Мой профиль</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-6 mb-8">
                  <Avatar className="w-32 h-32 border-4 border-primary shadow-lg">
                    <AvatarFallback className="bg-secondary text-4xl font-bold">{currentUser.initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-1">{currentUser.name}</h2>
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-foreground">
                      {currentUser.role === 'admin' ? 'Администратор' : 'Участник'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Имя</Label>
                    <Input id="name" defaultValue={currentUser.name} className="rounded-xl border-2 mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="email@example.com" className="rounded-xl border-2 mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="bio">О себе</Label>
                    <Textarea id="bio" placeholder="Расскажите о себе..." className="rounded-xl border-2 mt-2" />
                  </div>
                  <Button className="w-full rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                    Сохранить изменения
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {currentUser.role === 'admin' && (
            <TabsContent value="admin" className="space-y-4 animate-fade-in">
              <Card className="border-2 rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-destructive/20 to-primary/30">
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Shield" size={24} />
                    Панель администратора
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <Label htmlFor="siteName" className="text-base font-semibold">Название сайта</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="siteName"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        className="rounded-xl border-2"
                      />
                      <Button className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                        Сохранить
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Icon name="UserCheck" size={20} />
                      Запросы на вступление ({pendingUsers.length})
                    </h3>
                    {pendingUsers.length > 0 ? (
                      <div className="space-y-3">
                        {pendingUsers.map((user) => (
                          <div key={user.id} className="p-4 rounded-xl bg-muted flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border-2 border-secondary">
                                <AvatarFallback className="bg-accent">{user.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-muted-foreground">Ожидает одобрения</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                                Одобрить
                              </Button>
                              <Button size="sm" variant="outline" className="rounded-full hover:bg-destructive/10">
                                Отклонить
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Нет новых запросов</p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Icon name="Users" size={20} />
                      Управление пользователями ({approvedUsers.length})
                    </h3>
                    <div className="space-y-3">
                      {approvedUsers.map((user) => (
                        <div key={user.id} className="p-4 rounded-xl bg-muted flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border-2 border-primary">
                              <AvatarFallback className="bg-secondary">{user.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{user.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {user.role === 'admin' ? 'Администратор' : 'Участник'}
                              </Badge>
                            </div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="rounded-full gap-2">
                                <Icon name="Settings" size={16} />
                                Управление
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-2xl">
                              <DialogHeader>
                                <DialogTitle>Управление пользователем: {user.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`block-${user.id}`}>Заблокировать пользователя</Label>
                                  <Switch id={`block-${user.id}`} />
                                </div>
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`mod-${user.id}`}>Модератор контента</Label>
                                  <Switch id={`mod-${user.id}`} />
                                </div>
                                <Separator />
                                <Button variant="destructive" className="w-full rounded-full gap-2">
                                  <Icon name="Trash2" size={16} />
                                  Удалить пользователя
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Icon name="FileText" size={20} />
                      Модерация контента
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button variant="outline" className="rounded-xl gap-2 h-auto py-4 hover:scale-105 transition-transform duration-200">
                        <Icon name="MessageSquare" size={20} />
                        <div className="text-left">
                          <p className="font-semibold">Сообщения</p>
                          <p className="text-xs text-muted-foreground">Проверка жалоб</p>
                        </div>
                      </Button>
                      <Button variant="outline" className="rounded-xl gap-2 h-auto py-4 hover:scale-105 transition-transform duration-200">
                        <Icon name="Image" size={20} />
                        <div className="text-left">
                          <p className="font-semibold">Медиа</p>
                          <p className="text-xs text-muted-foreground">Проверка файлов</p>
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}