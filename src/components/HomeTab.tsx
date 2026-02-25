import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { TabsContent } from '@/components/ui/tabs';
import api from '@/lib/api';

type User = {
  id: number;
  name: string;
  avatar: string;
  initials: string;
  status: 'approved' | 'pending';
  role: 'admin' | 'user';
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

type Comment = {
  id: number;
  post_id: number;
  user_id: number;
  text: string;
  created_at: string;
  user_name: string;
  user_initials: string;
};

type HomeTabProps = {
  posts: Post[];
  users: User[];
  currentUserId?: number;
  onCreatePost?: (text: string, images?: string[]) => void;
  onToggleLike?: (postId: number) => void;
  onAddComment?: (postId: number, text: string) => Promise<Comment | null>;
};

function MediaGrid({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  const cols = images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : images.length === 3 ? 'grid-cols-3' : 'grid-cols-2';
  const maxH = images.length === 1 ? 'max-h-96' : 'max-h-52';
  return (
    <div className={`grid gap-1 ${cols}`}>
      {images.map((src, i) =>
        src.startsWith('data:video') || src.match(/\.(mp4|webm|ogg|mov)$/i) ? (
          <video key={i} src={src} controls className={`w-full rounded-xl object-contain bg-black ${maxH}`} />
        ) : (
          <img
            key={i}
            src={src}
            alt={`фото ${i + 1}`}
            className={`w-full rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity ${maxH}`}
            onClick={() => window.open(src, '_blank')}
          />
        )
      )}
    </div>
  );
}

function PostCard({ post, users, currentUserId, onToggleLike, onAddComment }: {
  post: Post;
  users: User[];
  currentUserId?: number;
  onToggleLike?: (postId: number) => void;
  onAddComment?: (postId: number, text: string) => Promise<Comment | null>;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [liked, setLiked] = useState(post.likedByMe || false);
  const [likesCount, setLikesCount] = useState(post.likes);

  const author = users.find(u => u.id === post.userId);
  const mediaList = post.images && post.images.length > 0 ? post.images : post.image ? [post.image] : [];

  const handleToggleComments = async () => {
    if (!showComments && !commentsLoaded) {
      try {
        const data = await api.getComments(post.id);
        setComments(data);
        setCommentsLoaded(true);
      } catch (e) { console.error(e); }
    }
    setShowComments(prev => !prev);
  };

  const handleLike = () => {
    if (!currentUserId) return;
    setLiked(prev => !prev);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
    onToggleLike?.(post.id);
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !currentUserId || !onAddComment) return;
    setSendingComment(true);
    try {
      const comment = await onAddComment(post.id, commentText.trim());
      if (comment) {
        setComments(prev => [...prev, comment]);
        setCommentText('');
      }
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow duration-300 rounded-2xl overflow-hidden animate-scale-in">
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
        {post.text && <p className="text-foreground leading-relaxed">{post.text}</p>}
        {mediaList.length > 0 && <MediaGrid images={mediaList} />}
        <Separator />
        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 rounded-full transition-colors ${liked ? 'text-red-500 hover:bg-red-50' : 'hover:bg-primary/20'}`}
            onClick={handleLike}
          >
            <Icon name={liked ? 'Heart' : 'Heart'} size={18} className={liked ? 'fill-red-500 text-red-500' : ''} />
            {likesCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 rounded-full ${showComments ? 'bg-secondary/20' : 'hover:bg-secondary/20'}`}
            onClick={handleToggleComments}
          >
            <Icon name="MessageCircle" size={18} />
            {post.comments + (comments.length > (commentsLoaded ? 0 : comments.length) ? comments.length - post.comments : 0)}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-accent/20">
            <Icon name="Share2" size={18} />
          </Button>
        </div>

        {showComments && (
          <div className="space-y-3 pt-2 border-t">
            {comments.length === 0 && commentsLoaded && (
              <p className="text-sm text-muted-foreground text-center py-2">Пока нет комментариев</p>
            )}
            {comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <Avatar className="w-8 h-8 border border-border flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{c.user_initials}</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-xl px-3 py-2 flex-1">
                  <p className="text-xs font-semibold mb-0.5">{c.user_name}</p>
                  <p className="text-sm">{c.text}</p>
                </div>
              </div>
            ))}
            {currentUserId && (
              <div className="flex gap-2 pt-1">
                <Input
                  placeholder="Написать комментарий..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                  className="rounded-full border-2 text-sm"
                />
                <Button
                  size="icon"
                  onClick={handleSendComment}
                  disabled={!commentText.trim() || sendingComment}
                  className="rounded-full bg-primary text-white flex-shrink-0"
                >
                  <Icon name="Send" size={16} />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function HomeTab({ posts, users, currentUserId, onCreatePost, onToggleLike, onAddComment }: HomeTabProps) {
  const [postText, setPostText] = useState('');
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPendingImages(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
    e.target.value = '';
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
        reader.onload = (ev) => setPendingImages(prev => [...prev, ev.target?.result as string]);
        reader.readAsDataURL(file);
        break;
      }
    }
  }, []);

  const handlePublish = () => {
    if (!postText.trim() && pendingImages.length === 0) return;
    onCreatePost?.(postText, pendingImages.length > 0 ? pendingImages : undefined);
    setPostText('');
    setPendingImages([]);
  };

  return (
    <TabsContent value="home" className="space-y-4 animate-fade-in">
      <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
      <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={handleFileSelect} />

      <Card className="border-2 hover:shadow-lg transition-shadow duration-300 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/30 to-secondary/30">
          <CardTitle className="flex items-center gap-2">
            <Icon name="Pencil" size={20} />
            Создать публикацию
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Textarea
            placeholder="Чем хотите поделиться? (Ctrl+V для вставки фото)"
            className="mb-3 min-h-24 resize-none rounded-xl border-2 focus:border-primary transition-colors"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            onPaste={handlePaste}
          />
          {pendingImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {pendingImages.map((src, i) => (
                <div key={i} className="relative inline-block">
                  {src.startsWith('data:video') ? (
                    <video src={src} className="h-20 w-20 rounded-xl object-cover" />
                  ) : (
                    <img src={src} alt="preview" className="h-20 w-20 rounded-xl object-cover" />
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
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="rounded-full gap-2 hover:scale-105 transition-transform duration-200" onClick={() => photoInputRef.current?.click()}>
              <Icon name="Image" size={16} />
              Фото
            </Button>
            <Button variant="outline" size="sm" className="rounded-full gap-2 hover:scale-105 transition-transform duration-200" onClick={() => videoInputRef.current?.click()}>
              <Icon name="Video" size={16} />
              Видео
            </Button>
            <Button
              className="ml-auto rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              onClick={handlePublish}
              disabled={!postText.trim() && pendingImages.length === 0}
            >
              Опубликовать
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            users={users}
            currentUserId={currentUserId}
            onToggleLike={onToggleLike}
            onAddComment={onAddComment}
          />
        ))}
      </div>
    </TabsContent>
  );
}
