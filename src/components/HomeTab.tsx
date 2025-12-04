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
};

export default function HomeTab({ posts, users }: HomeTabProps) {
  return (
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
  );
}
