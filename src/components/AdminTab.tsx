import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
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

type AdminTabProps = {
  siteName: string;
  setSiteName: (name: string) => void;
  pendingUsers: User[];
  approvedUsers: User[];
  onUserApproved?: (userId: number) => void;
  onUserRejected?: (userId: number) => void;
};

export default function AdminTab({ siteName, setSiteName, pendingUsers, approvedUsers, onUserApproved, onUserRejected }: AdminTabProps) {
  const [processing, setProcessing] = useState<number | null>(null);

  const handleApprove = async (userId: number) => {
    setProcessing(userId);
    try {
      await api.approveUser(userId);
      onUserApproved?.(userId);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: number) => {
    setProcessing(userId);
    try {
      await api.rejectUser(userId);
      onUserRejected?.(userId);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <TabsContent value="admin" className="space-y-4 animate-fade-in">
      <Card className="border rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-white">
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
                className="rounded-md border-2"
              />
              <Button className="rounded-md bg-primary text-white hover:bg-primary/90">
                Сохранить
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon name="UserCheck" size={20} className="text-primary" />
              Заявки на вступление ({pendingUsers.length})
            </h3>
            {pendingUsers.length > 0 ? (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="p-4 rounded-lg bg-muted flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{user.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">Ожидает одобрения</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(user.id)}
                        disabled={processing === user.id}
                        className="rounded-md bg-primary text-white hover:bg-primary/90"
                      >
                        <Icon name="Check" size={16} className="mr-1" />
                        Одобрить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(user.id)}
                        disabled={processing === user.id}
                        className="rounded-md hover:bg-destructive/10"
                      >
                        <Icon name="X" size={16} className="mr-1" />
                        Отклонить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Нет новых заявок</p>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon name="Users" size={20} className="text-primary" />
              Активные пользователи ({approvedUsers.length})
            </h3>
            <div className="space-y-3">
              {approvedUsers.map((user) => (
                <div key={user.id} className="p-4 rounded-lg bg-muted flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{user.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {user.role === 'admin' ? 'Администратор' : 'Участник'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
