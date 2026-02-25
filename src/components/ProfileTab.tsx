import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import api from '@/lib/api';

type User = {
  id: number;
  name: string;
  avatar: string;
  initials: string;
  status: 'approved' | 'pending';
  role: 'admin' | 'user';
};

type MyChat = {
  id: number;
  name: string;
  is_private: boolean;
  is_group: boolean;
  admin_id: number;
  members_count?: number;
};

type PublicChat = {
  id: number;
  name: string;
  is_private: boolean;
  members_count: number;
};

type ChatMember = {
  id: number;
  name: string;
  initials: string;
  login: string;
  position: string;
};

type ProfileTabProps = {
  currentUser: User;
  onProfileUpdate?: (name: string, initials: string) => void;
};

export default function ProfileTab({ currentUser, onProfileUpdate }: ProfileTabProps) {
  const [name, setName] = useState(currentUser.name);
  const [position, setPosition] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [myChats, setMyChats] = useState<MyChat[]>([]);
  const [publicChats, setPublicChats] = useState<PublicChat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatPrivate, setNewChatPrivate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [expandedChat, setExpandedChat] = useState<number | null>(null);
  const [chatMembers, setChatMembers] = useState<Record<number, ChatMember[]>>({});
  const [addMemberLogin, setAddMemberLogin] = useState('U_');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberSuccess, setAddMemberSuccess] = useState('');

  useEffect(() => {
    setName(currentUser.name);
  }, [currentUser.name]);

  useEffect(() => {
    loadChats();
  }, [currentUser.id]);

  const loadChats = async () => {
    setChatsLoading(true);
    try {
      const [mine, pub] = await Promise.all([
        api.getMyChats(currentUser.id),
        api.getPublicChats(currentUser.id),
      ]);
      setMyChats(mine);
      setPublicChats(pub);
    } catch (e) {
      console.error(e);
    } finally {
      setChatsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const result = await api.updateProfile(currentUser.id, name, bio, position);
      if (result) {
        if (onProfileUpdate) {
          onProfileUpdate(result.name, result.initials);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error('Failed to save profile:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChat = async () => {
    setCreateError('');
    if (!newChatName.trim()) {
      setCreateError('Введите название беседы');
      return;
    }
    setCreateLoading(true);
    try {
      const chat = await api.createChat(newChatName.trim(), true, currentUser.id, newChatPrivate);
      setMyChats(prev => [{ ...chat, admin_id: currentUser.id }, ...prev]);
      setNewChatName('');
      setNewChatPrivate(false);
      setShowCreateForm(false);
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Ошибка создания беседы');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleExpandChat = async (chatId: number) => {
    if (expandedChat === chatId) {
      setExpandedChat(null);
      return;
    }
    setExpandedChat(chatId);
    setAddMemberError('');
    setAddMemberSuccess('');
    setAddMemberLogin('U_');
    if (!chatMembers[chatId]) {
      try {
        const members = await api.getChatMembers(chatId);
        setChatMembers(prev => ({ ...prev, [chatId]: members }));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddMember = async (chatId: number) => {
    setAddMemberError('');
    setAddMemberSuccess('');
    if (!addMemberLogin || addMemberLogin === 'U_') {
      setAddMemberError('Введите логин пользователя');
      return;
    }
    setAddMemberLoading(true);
    try {
      await api.addChatMember(chatId, addMemberLogin.trim(), currentUser.id);
      setAddMemberSuccess(`Пользователь ${addMemberLogin} добавлен`);
      setAddMemberLogin('U_');
      const members = await api.getChatMembers(chatId);
      setChatMembers(prev => ({ ...prev, [chatId]: members }));
    } catch (e: unknown) {
      setAddMemberError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleJoinChat = async (chatId: number) => {
    try {
      await api.joinChat(chatId, currentUser.id);
      await loadChats();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  const handleLoginInput = (value: string) => {
    if (!value.startsWith('U_')) value = 'U_' + value.replace(/^U_?/, '');
    setAddMemberLogin(value);
  };

  return (
    <TabsContent value="profile" className="animate-fade-in space-y-4">
      <Card className="border rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-white">
          <CardTitle>Мой профиль</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 mb-8">
            <Avatar className="w-32 h-32 border-4 border-primary shadow-lg">
              <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">{currentUser.initials}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">{currentUser.name}</h2>
              {position && <p className="text-muted-foreground mb-2">{position}</p>}
              <Badge className="bg-primary text-white">
                {currentUser.role === 'admin' ? 'Администратор' : 'Участник'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{myChats.length}</p>
              <p className="text-sm text-muted-foreground">Бесед</p>
            </div>
            <div className="text-center border-x border-border">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Сообщений</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-sm text-muted-foreground">Постов</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-md border-2 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="position">Должность</Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Например: Руководитель отдела"
                className="rounded-md border-2 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="bio">О себе</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Расскажите о себе..."
                className="rounded-md border-2 mt-2"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full rounded-md bg-primary text-white hover:bg-primary/90"
            >
              {saving ? (
                'Сохранение...'
              ) : saved ? (
                <span className="flex items-center gap-2 justify-center">
                  <Icon name="Check" size={18} /> Сохранено
                </span>
              ) : (
                'Сохранить изменения'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-white flex flex-row items-center justify-between">
          <CardTitle>Мои беседы</CardTitle>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => { setShowCreateForm(!showCreateForm); setCreateError(''); }}
            className="rounded-md"
          >
            <Icon name="Plus" size={16} className="mr-1" />
            Создать
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          {showCreateForm && (
            <div className="mb-4 p-4 bg-muted rounded-lg space-y-3 border border-border">
              <h3 className="font-semibold">Новая беседа</h3>
              <div>
                <Label>Название беседы</Label>
                <Input
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Например: Рабочая группа"
                  className="rounded-md border-2 mt-2"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateChat()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={!newChatPrivate ? 'default' : 'outline'}
                  onClick={() => setNewChatPrivate(false)}
                  className={`flex-1 rounded-md text-sm ${!newChatPrivate ? 'bg-primary text-white' : ''}`}
                >
                  <Icon name="Globe" size={16} className="mr-1" />
                  Открытая
                </Button>
                <Button
                  variant={newChatPrivate ? 'default' : 'outline'}
                  onClick={() => setNewChatPrivate(true)}
                  className={`flex-1 rounded-md text-sm ${newChatPrivate ? 'bg-primary text-white' : ''}`}
                >
                  <Icon name="Lock" size={16} className="mr-1" />
                  Приватная
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {newChatPrivate
                  ? 'Приватная: только вы можете добавлять участников по логину'
                  : 'Открытая: любой участник может самостоятельно вступить'}
              </p>
              {createError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <Icon name="AlertCircle" size={14} /> {createError}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateChat}
                  disabled={createLoading}
                  className="flex-1 rounded-md bg-primary text-white"
                >
                  {createLoading ? 'Создание...' : 'Создать беседу'}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)} className="rounded-md">
                  Отмена
                </Button>
              </div>
            </div>
          )}

          {chatsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Загрузка...</p>
          ) : myChats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">У вас пока нет бесед</p>
          ) : (
            <div className="space-y-2">
              {myChats.map((chat) => (
                <div key={chat.id} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-3 hover:bg-muted transition-colors text-left"
                    onClick={() => handleExpandChat(chat.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-full grid place-items-center">
                        <Icon name={chat.is_private ? 'Lock' : 'Globe'} size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{chat.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {chat.is_private ? 'Приватная' : 'Открытая'}
                          </Badge>
                          {chat.admin_id === currentUser.id && (
                            <Badge className="text-xs px-1.5 py-0 bg-primary text-white">Вы админ</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Icon name={expandedChat === chat.id ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground" />
                  </button>

                  {expandedChat === chat.id && chat.is_private && chat.admin_id === currentUser.id && (
                    <div className="p-3 border-t bg-muted/40 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Участники</p>
                      {(chatMembers[chat.id] || []).map(m => (
                        <div key={m.id} className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-primary/10 rounded-full grid place-items-center text-xs font-bold text-primary">
                            {m.initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.login}</p>
                          </div>
                        </div>
                      ))}

                      <div className="pt-2 border-t space-y-2">
                        <Label className="text-xs">Добавить по логину</Label>
                        <div className="flex gap-2">
                          <Input
                            value={addMemberLogin}
                            onChange={(e) => handleLoginInput(e.target.value)}
                            placeholder="U_username"
                            className="rounded-md border-2 text-sm h-8"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMember(chat.id)}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddMember(chat.id)}
                            disabled={addMemberLoading}
                            className="rounded-md bg-primary text-white h-8 px-3"
                          >
                            <Icon name="UserPlus" size={14} />
                          </Button>
                        </div>
                        {addMemberError && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <Icon name="AlertCircle" size={12} /> {addMemberError}
                          </p>
                        )}
                        {addMemberSuccess && (
                          <p className="text-xs text-green-600 flex items-center gap-1">
                            <Icon name="Check" size={12} /> {addMemberSuccess}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {expandedChat === chat.id && chat.is_private && chat.admin_id !== currentUser.id && (
                    <div className="p-3 border-t bg-muted/40">
                      <p className="text-xs text-muted-foreground">Только администратор может управлять участниками</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {publicChats.length > 0 && (
        <Card className="border rounded-lg overflow-hidden">
          <CardHeader className="bg-muted">
            <CardTitle className="text-base">Открытые беседы</CardTitle>
            <p className="text-sm text-muted-foreground">Вступайте в открытые беседы сообщества</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {publicChats.map((chat) => (
                <div key={chat.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-full grid place-items-center">
                      <Icon name="Globe" size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{chat.name}</p>
                      <p className="text-xs text-muted-foreground">{chat.members_count} участников</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleJoinChat(chat.id)}
                    className="rounded-md bg-primary text-white h-8 text-xs"
                  >
                    Вступить
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
