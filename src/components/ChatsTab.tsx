import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
  imageUrl?: string;
};

type Chat = {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  isGroup: boolean;
};

type ChatsTabProps = {
  chats: Chat[];
  messages: Message[];
  users: User[];
  currentUser: User;
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat | null) => void;
  onCreateChat: (chatName: string, isGroup: boolean) => void;
  onSendMessage: (text: string, imageUrl?: string) => void;
  onChangeChatAvatar: (chatId: number, avatarUrl: string) => void;
};

export default function ChatsTab({ chats, messages, users, currentUser, selectedChat, setSelectedChat, onCreateChat, onSendMessage, onChangeChatAvatar }: ChatsTabProps) {
  const [newChatName, setNewChatName] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const [editingChatId, setEditingChatId] = useState<number | null>(null);

  const handleCreateChat = () => {
    if (newChatName.trim()) {
      onCreateChat(newChatName, isGroupChat);
      setNewChatName('');
      setIsDialogOpen(false);
    }
  };

  const handleSendMessage = () => {
    if (messageText.trim() || pendingImage) {
      onSendMessage(messageText, pendingImage || undefined);
      setMessageText('');
      setPendingImage(null);
    }
  };

  const handleAvatarClick = (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    avatarFileInputRef.current?.click();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingChatId !== null) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        onChangeChatAvatar(editingChatId, dataUrl);
        setEditingChatId(null);
      };
      reader.readAsDataURL(file);
    }
    if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPendingImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    if (mediaFileInputRef.current) mediaFileInputRef.current.value = '';
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPendingImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  }, []);

  const ChatAvatar = ({ chat, size = 'md' }: { chat: Chat; size?: 'sm' | 'md' }) => {
    const sizeClass = size === 'md' ? 'w-12 h-12' : 'w-10 h-10';
    return (
      <Avatar className={`${sizeClass} border-2 border-primary/20`}>
        {chat.avatar ? (
          <AvatarImage src={chat.avatar} alt={chat.name} className="object-cover" />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {chat.isGroup ? <Icon name="Users" size={size === 'md' ? 20 : 18} /> : chat.name[0]}
        </AvatarFallback>
      </Avatar>
    );
  };

  return (
    <TabsContent value="chats" className="animate-fade-in">
      <input ref={avatarFileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleAvatarFileChange} />
      <input ref={mediaFileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaFileChange} />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 border rounded-lg overflow-hidden">
          <CardHeader className="bg-primary text-white">
            <CardTitle className="flex items-center justify-between">
              <span>Все беседы</span>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="rounded-full hover:bg-white/20 text-white">
                    <Icon name="Plus" size={20} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-lg">
                  <DialogHeader>
                    <DialogTitle>Создать новую беседу</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="chatName">Название беседы</Label>
                      <Input
                        id="chatName"
                        value={newChatName}
                        onChange={(e) => setNewChatName(e.target.value)}
                        placeholder="Название вашей беседы"
                        className="rounded-md border-2 mt-2"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isGroup">Групповая беседа</Label>
                      <Switch id="isGroup" checked={isGroupChat} onCheckedChange={setIsGroupChat} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isGroupChat ? 'Групповая — все участники видят беседу' : 'Приватная — только вы и собеседник'}
                    </p>
                    <Button onClick={handleCreateChat} className="w-full rounded-md bg-primary text-white hover:bg-primary/90">
                      Создать
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <ScrollArea className="h-[500px]">
            <CardContent className="p-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-4 rounded-lg mb-1 transition-all hover:bg-primary/5 ${
                    selectedChat?.id === chat.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative group cursor-pointer" onClick={(e) => handleAvatarClick(chat.id, e)}>
                      <ChatAvatar chat={chat} />
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Icon name="Camera" size={16} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold flex items-center gap-1">
                          {!chat.isGroup && <Icon name="Lock" size={14} className="text-muted-foreground" />}
                          {chat.name}
                        </p>
                        {chat.unread > 0 && (
                          <Badge className="bg-primary text-white rounded-full text-xs min-w-[22px] h-[22px] flex items-center justify-center">
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

        <Card className="lg:col-span-2 border rounded-lg overflow-hidden">
          {selectedChat ? (
            <>
              <CardHeader className="bg-primary text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative group cursor-pointer" onClick={(e) => handleAvatarClick(selectedChat.id, e)}>
                      <ChatAvatar chat={selectedChat} size="sm" />
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Icon name="Camera" size={14} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <span className="text-white flex items-center gap-1">
                        {!selectedChat.isGroup && <Icon name="Lock" size={14} />}
                        {selectedChat.name}
                      </span>
                      <p className="text-white/60 text-xs font-normal">
                        {selectedChat.isGroup ? 'Групповая беседа' : 'Приватная беседа'}
                      </p>
                    </div>
                  </div>
                  {selectedChat.isGroup && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 rounded-full">
                          <Icon name="UserPlus" size={18} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-lg">
                        <DialogHeader>
                          <DialogTitle>Пригласить в беседу</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 pt-4">
                          {users.filter(u => u.id !== currentUser.id).map((user) => (
                            <button key={user.id} className="w-full p-3 rounded-lg hover:bg-primary/5 transition-colors flex items-center gap-3 text-left">
                              <Avatar className="w-10 h-10 border border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{user.initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.status === 'approved' ? 'Участник' : 'Ожидает'}</p>
                              </div>
                              <Icon name="Plus" size={18} className="text-primary" />
                            </button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardTitle>
              </CardHeader>
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === currentUser.id;
                    const sender = users.find(u => u.id === msg.senderId);
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8 border border-border">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{sender?.initials}</AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
                          <div className={`rounded-lg p-3 ${isOwn ? 'bg-primary text-white' : 'bg-muted'}`}>
                            {msg.text && <p>{msg.text}</p>}
                            {msg.imageUrl && (
                              <div className="mt-2">
                                {msg.imageUrl.startsWith('data:video') || msg.imageUrl.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                  <video
                                    src={msg.imageUrl}
                                    controls
                                    className="max-w-full rounded-lg max-h-64"
                                  />
                                ) : (
                                  <img
                                    src={msg.imageUrl}
                                    alt="вложение"
                                    className="max-w-full rounded-lg max-h-64 object-contain cursor-pointer"
                                    onClick={() => window.open(msg.imageUrl, '_blank')}
                                  />
                                )}
                              </div>
                            )}
                            {msg.hasImage && !msg.imageUrl && (
                              <div className="mt-2 bg-background/50 rounded-lg p-4 text-center text-2xl">📷</div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 px-2">{msg.timestamp}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <CardContent className="pt-3 border-t">
                {pendingImage && (
                  <div className="relative mb-2 inline-block">
                    {pendingImage.startsWith('data:video') ? (
                      <video src={pendingImage} className="h-20 rounded-lg" controls />
                    ) : (
                      <img src={pendingImage} alt="preview" className="h-20 rounded-lg object-cover" />
                    )}
                    <button
                      onClick={() => setPendingImage(null)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="rounded-full hover:scale-105 transition-transform duration-200"
                    onClick={() => mediaFileInputRef.current?.click()}
                    title="Прикрепить фото или видео"
                  >
                    <Icon name="Paperclip" size={20} />
                  </Button>
                  <Input
                    placeholder="Написать сообщение... (Ctrl+V для вставки фото)"
                    className="flex-1 rounded-full border-2"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="rounded-full bg-primary text-white hover:bg-primary/90"
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() && !pendingImage}
                  >
                    <Icon name="Send" size={20} />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="h-[500px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-4 text-primary/30" />
                <p>Выберите беседу для начала общения</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </TabsContent>
  );
}
