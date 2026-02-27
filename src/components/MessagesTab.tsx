import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import type { Chat } from '@/types/index';

type MessagesTabProps = {
  chats: Chat[];
  onOpenChat: (chat: Chat) => void;
};

export default function MessagesTab({ chats, onOpenChat }: MessagesTabProps) {
  const privateChats = chats.filter(c => !c.isGroup);

  return (
    <TabsContent value="messages" className="animate-fade-in">
      <Card className="border rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-white">
          <CardTitle>Личные сообщения</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {privateChats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="MessageCircle" size={40} className="mx-auto mb-3 text-primary/30" />
              <p>Нет личных сообщений</p>
            </div>
          ) : (
            <div className="space-y-3">
              {privateChats.map((chat) => (
                <button key={chat.id} onClick={() => onOpenChat(chat)} className="w-full p-4 rounded-lg bg-muted hover:bg-primary/5 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{chat.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{chat.name}</p>
                      <p className="text-sm text-muted-foreground">{chat.lastMessage}</p>
                    </div>
                    <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
