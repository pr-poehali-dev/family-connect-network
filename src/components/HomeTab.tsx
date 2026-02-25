import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { TabsContent } from '@/components/ui/tabs';

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
  timestamp: string;
  likes: number;
  comments: number;
};

type HomeTabProps = {
  posts: Post[];
  users: User[];
  currentUser?: User;
  onCreatePost?: (text: string, imageUrl?: string) => void;
};

export default function HomeTab({ posts, users, currentUser, onCreatePost }: HomeTabProps) {
  const [postText, setPostText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPendingImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
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
        reader.onload = (ev) => setPendingImage(ev.target?.result as string);
        reader.readAsDataURL(file);
        break;
      }
    }
  }, []);

  const handlePublish = () => {
    if (!postText.trim() && !pendingImage) return;
    onCreatePost?.(postText, pendingImage || undefined);
    setPostText('');
    setPendingImage(null);
  };

  return (
    <TabsContent value="home" className="space-y-4 animate-fade-in">
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />

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
          {pendingImage && (
            <div className="relative mb-3 inline-block">
              {pendingImage.startsWith('data:video') ? (
                <video src={pendingImage} className="max-h-48 rounded-xl" controls />
              ) : (
                <img src={pendingImage} alt="preview" className="max-h-48 rounded-xl object-contain" />
              )}
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center text-sm font-bold"
              >
                ×
              </button>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-2 hover:scale-105 transition-transform duration-200"
              onClick={() => photoInputRef.current?.click()}
            >
              <Icon name="Image" size={16} />
              Фото
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-2 hover:scale-105 transition-transform duration-200"
              onClick={() => videoInputRef.current?.click()}
            >
              <Icon name="Video" size={16} />
              Видео
            </Button>
            <Button
              className="ml-auto rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              onClick={handlePublish}
              disabled={!postText.trim() && !pendingImage}
            >
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
                {post.text && <p className="text-foreground leading-relaxed">{post.text}</p>}
                {post.image && (
                  post.image.match(/\.(mp4|webm|ogg|mov)$/i) || post.image.startsWith('data:video') ? (
                    <video src={post.image} controls className="w-full rounded-xl max-h-96 object-contain bg-black" />
                  ) : (
                    <img
                      src={post.image}
                      alt="фото публикации"
                      className="w-full rounded-xl max-h-96 object-contain cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => window.open(post.image, '_blank')}
                    />
                  )
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
  );
}
