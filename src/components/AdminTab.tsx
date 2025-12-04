import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

type AdminTabProps = {
  siteName: string;
  setSiteName: (name: string) => void;
  pendingUsers: User[];
  approvedUsers: User[];
};

export default function AdminTab({ siteName, setSiteName, pendingUsers, approvedUsers }: AdminTabProps) {
  return (
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
  );
}
