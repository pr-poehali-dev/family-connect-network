import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { TabsContent } from '@/components/ui/tabs';

type User = {
  id: number;
  name: string;
  avatar: string;
  initials: string;
  status: 'approved' | 'pending';
  role: 'admin' | 'user';
};

type ProfileTabProps = {
  currentUser: User;
};

export default function ProfileTab({ currentUser }: ProfileTabProps) {
  return (
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
  );
}
