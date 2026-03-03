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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import api from '@/lib/api';

type User = {
  id: number;
  name: string;
  avatar: string;
  initials: string;
  status: 'approved' | 'pending';
  role: 'admin' | 'user';
  login?: string;
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
  onCreateChat: (chatName: string, isGroup: boolean, isPrivate: boolean) => void;
  onSendMessage: (text: string, images?: string[]) => void;
  onChangeChatAvatar: (chatId: number, avatarUrl: string) => void;
  onStartPrivateChat?: (userId: number) => void;
};

export default function ChatsTab({ chats, messages, users, currentUser, selectedChat, setSelectedChat, onCreateChat, onSendMessage, onChangeChatAvatar, onStartPrivateChat }: ChatsTabProps) {
  const [newChatName, setNewChatName] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(true);
  const [isPrivateChat, setIsPrivateChat] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<number | null>(null);
  const [inviteError, setInviteError] = useState('');
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const [editingChatId, setEditingChatId] = useState<number | null>(null);

  const handleInviteUser = async (user: User) => {
    if (!selectedChat) return;
    setInvitingUserId(user.id);
    setInviteError('');
    try {
      await api.addChatMember(selectedChat.id, user.login || user.name, currentUser.id);
      setInviteDialogOpen(false);
    } catch (e) {
      setInviteError('Не удалось пригласить пользователя');
    } finally {
      setInvitingUserId(null);
    }
  };

  const handleCreateChat = () => {
    if (newChatName.trim()) {
      onCreateChat(newChatName, isGroupChat, isPrivateChat);
      setNewChatName('');
      setIsGroupChat(true);
      setIsPrivateChat(false);
      setIsDialogOpen(false);
    }
  };

  const handleSendMessage = () => {
    if (messageText.trim() || pendingImages.length > 0) {
      onSendMessage(messageText, pendingImages.length > 0 ? pendingImages : undefined);
      setMessageText('');
      setPendingImages([]);
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

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    arr.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPendingImages(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
    if (mediaFileInputRef.current) mediaFileInputRef.current.value = '';
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/') || item.type.startsWith('video/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPendingImages(prev => [...prev, ev.target?.result as string]);
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
      <input ref={mediaFileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaFileChange} />
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isPrivate">Приватная (только по приглашению)</Label>
                      <Switch id="isPrivate" checked={isPrivateChat} onCheckedChange={setIsPrivateChat} />
                    </div>
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
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 rounded-full">
                          <Icon name="UserPlus" size={18} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-lg">
                        <DialogHeader>
                          <DialogTitle>Пригласить в беседу</DialogTitle>
                        </DialogHeader>
                        {inviteError && <p className="text-sm text-destructive px-1">{inviteError}</p>}
                        <div className="space-y-2 pt-2">
                          {users.filter(u => u.id !== currentUser.id && u.status === 'approved').map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleInviteUser(user)}
                              disabled={invitingUserId === user.id}
                              className="w-full p-3 rounded-lg hover:bg-primary/5 transition-colors flex items-center gap-3 text-left disabled:opacity-50"
                            >
                              <Avatar className="w-10 h-10 border border-primary/20">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{user.initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.role === 'admin' ? 'Администратор' : 'Участник'}</p>
                              </div>
                              {invitingUserId === user.id
                                ? <Icon name="Loader" size={18} className="text-primary animate-spin" />
                                : <Icon name="Plus" size={18} className="text-primary" />}
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
                        {!isOwn && sender ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-8 h-8 rounded-full border border-border bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold hover:ring-2 hover:ring-primary/30 transition-all flex-shrink-0">
                                {sender.initials}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => onStartPrivateChat?.(sender.id)}>
                                <Icon name="MessageCircle" size={14} className="mr-2" />
                                Написать личное сообщение
                              </DropdownMenuItem>
                              {currentUser.role === 'admin' && selectedChat?.isGroup && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={async () => {
                                    try { await api.removeChatMember?.(selectedChat.id, sender.id); } catch (e) { console.error(e); }
                                  }}
                                >
                                  <Icon name="UserMinus" size={14} className="mr-2" />
                                  Выгнать из беседы
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Avatar className="w-8 h-8 border border-border flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{sender?.initials}</AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
                          <div className={`rounded-lg p-3 ${isOwn ? 'bg-primary text-white' : 'bg-muted'}`}>
                            {msg.text && <p>{msg.text}</p>}
                            {(() => {
                              const imgs = msg.images && msg.images.length > 0 ? msg.images : (msg.imageUrl ? [msg.imageUrl] : []);
                              if (imgs.length === 0 && msg.hasImage) return <div className="mt-2 bg-background/50 rounded-lg p-4 text-center text-2xl">📷</div>;
                              if (imgs.length === 0) return null;
                              return (
                                <div className={`mt-2 grid gap-1 ${imgs.length === 1 ? 'grid-cols-1' : imgs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                  {imgs.map((src, i) => (
                                    src.startsWith('data:video') || src.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                      <video key={i} src={src} controls className="w-full rounded-lg max-h-48 object-cover" />
                                    ) : (
                                      <img
                                        key={i}
                                        src={src}
                                        alt={`вложение ${i + 1}`}
                                        className="w-full rounded-lg object-cover cursor-pointer"
                                        style={{ maxHeight: imgs.length === 1 ? '240px' : '120px' }}
                                        onClick={() => window.open(src, '_blank')}
                                      />
                                    )
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 px-2">{msg.timestamp}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <CardContent className="pt-3 border-t">
                {pendingImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pendingImages.map((src, i) => (
                      <div key={i} className="relative inline-block">
                        {src.startsWith('data:video') ? (
                          <video src={src} className="h-16 w-16 rounded-lg object-cover" />
                        ) : (
                          <img src={src} alt="preview" className="h-16 w-16 rounded-lg object-cover" />
                        )}
                        <button
                          onClick={() => setPendingImages(prev => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
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
                    disabled={!messageText.trim() && pendingImages.length === 0}
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