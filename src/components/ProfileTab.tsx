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

  useEffect(() => {
    setName(currentUser.name);
  }, [currentUser.name]);

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

  return (
    <TabsContent value="profile" className="animate-fade-in">
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
              <p className="text-2xl font-bold text-primary">0</p>
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
    </TabsContent>
  );
}
