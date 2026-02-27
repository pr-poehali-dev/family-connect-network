import { useState, useEffect, useCallback, useRef } from 'react';
import { Tabs } from '@/components/ui/tabs';
import HomeTab from '@/components/HomeTab';
import ChatsTab from '@/components/ChatsTab';
import ProfileTab from '@/components/ProfileTab';
import AdminTab from '@/components/AdminTab';
import AuthPage from '@/components/AuthPage';
import PendingScreen from '@/components/PendingScreen';
import AppNav from '@/components/AppNav';
import AppTabs from '@/components/AppTabs';
import MessagesTab from '@/components/MessagesTab';
import api from '@/lib/api';
import type { User, Chat, Message, Post, DbChat, DbMessage, DbPost } from '@/types/index';
import { mapChat, mapMessage, mapPost, formatTime } from '@/types/index';

export default function Index() {
  const [authedUser, setAuthedUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('alfa_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
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

  const selectedChatRef = useRef(selectedChat);
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

  const currentUserRef = useRef(currentUser);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  useEffect(() => {
    if (!selectedChat || !currentUser) return;
    api.getMessages(selectedChat.id, currentUser.id).then((dbMsgs: DbMessage[]) => {
      setMessages(dbMsgs.map(mapMessage));
    }).catch(console.error);
  }, [selectedChat?.id]);

  useEffect(() => {
    if (!currentUser) return;
    const POSTS_INTERVAL = 15000;
    const MSGS_INTERVAL = 3000;
    const CHATS_INTERVAL = 15000;
    const USERS_INTERVAL = 15000;

    const postTimer = setInterval(async () => {
      try {
        const dbPosts = await api.getPosts();
        const fresh = dbPosts.map(mapPost);
        setPosts(prev => {
          const prevIds = new Set(prev.map((p: Post) => p.id));
          const newOnes = fresh.filter((p: Post) => !prevIds.has(p.id));
          const deletedIds = new Set(fresh.map((p: Post) => p.id));
          const kept = prev.filter((p: Post) => deletedIds.has(p.id));
          return newOnes.length > 0 ? [...newOnes, ...kept] : kept;
        });
      } catch { /* silent */ }
    }, POSTS_INTERVAL);

    const msgsTimer = setInterval(async () => {
      const chat = selectedChatRef.current;
      const user = currentUserRef.current;
      if (!chat || !user) return;
      try {
        const dbMsgs = await api.getMessages(chat.id, user.id);
        if (!dbMsgs) return;
        const fresh = dbMsgs.map(mapMessage);
        setMessages(prev => {
          const prevIds = new Set(prev.map((m: Message) => m.id));
          const newOnes = fresh.filter((m: Message) => !prevIds.has(m.id));
          return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
        });
      } catch { /* silent */ }
    }, MSGS_INTERVAL);

    const chatsTimer = setInterval(async () => {
      const user = currentUserRef.current;
      if (!user) return;
      try {
        const dbChats = await api.getChats(user.id);
        const fresh = dbChats.map(mapChat);
        setChats(prev => {
          const hasChanges = fresh.some((fc: Chat) => {
            const old = prev.find((c: Chat) => c.id === fc.id);
            return !old || old.lastMessage !== fc.lastMessage || old.unread !== fc.unread;
          }) || fresh.length !== prev.length;
          return hasChanges ? fresh : prev;
        });
      } catch { /* silent */ }
    }, CHATS_INTERVAL);

    const usersTimer = setInterval(async () => {
      const user = currentUserRef.current;
      if (!user) return;
      try {
        const dbUsers = await api.getUsers();
        const fresh: User[] = dbUsers.map((u: Record<string, unknown>) => ({
          id: u.id as number,
          name: u.name as string,
          avatar_url: (u.avatar_url as string) || '',
          initials: u.initials as string,
          status: u.status as string,
          role: u.role as 'admin' | 'user',
          position: (u.position as string) || '',
          bio: (u.bio as string) || '',
        }));
        setUsers(prev => {
          const hasChanges = fresh.length !== prev.length || fresh.some(fu => {
            const old = prev.find(u => u.id === fu.id);
            return !old || old.role !== fu.role || old.status !== fu.status || old.name !== fu.name || old.position !== fu.position || old.bio !== fu.bio;
          });
          return hasChanges ? fresh : prev;
        });
        const freshMe = fresh.find(u => u.id === user.id);
        if (freshMe) {
          setCurrentUser(prev => {
            if (!prev) return prev;
            const changed = prev.role !== freshMe.role || prev.status !== freshMe.status || prev.name !== freshMe.name || prev.position !== freshMe.position || prev.bio !== freshMe.bio;
            if (!changed) return prev;
            const updated = { ...prev, ...freshMe };
            setAuthedUser(updated);
            localStorage.setItem('alfa_user', JSON.stringify(updated));
            return updated;
          });
        }
      } catch { /* silent */ }
    }, USERS_INTERVAL);

    return () => {
      clearInterval(postTimer);
      clearInterval(msgsTimer);
      clearInterval(chatsTimer);
      clearInterval(usersTimer);
    };
  }, [currentUser?.id]);

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

  const handleRoleChanged = (userId: number, role: 'admin' | 'user') => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    if (currentUser && userId === currentUser.id) {
      const updated = { ...currentUser, role };
      setCurrentUser(updated);
      setAuthedUser(updated);
      localStorage.setItem('alfa_user', JSON.stringify(updated));
    }
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
      <AppNav
        siteName={siteName}
        userName={currentUser.name}
        userInitials={currentUser.initials}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <AppTabs isAdmin={currentUser.role === 'admin'} />

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

          <MessagesTab chats={chats} onOpenChat={handleOpenChat} />

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
              onRoleChanged={handleRoleChanged}
              currentUserId={currentUser.id}
            />
          )}
        </Tabs>
      </div>
    </div>
  );
}