import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TabsContent } from '@/components/ui/tabs';

type User = {
  id: number;
  name: string;
  avatar: string;
  initials: string;
  status: 'approved' | 'pending';
  role: 'admin' | 'user';
};

type Message = {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
  hasImage?: boolean;
};

type Chat = {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  unread: number;
  isGroup: boolean;
};

type ChatsTabProps = {
  chats: Chat[];
  messages: Message[];
  users: User[];
  currentUser: User;
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat | null) => void;
};

export default function ChatsTab({ chats, messages, users, currentUser, selectedChat, setSelectedChat }: ChatsTabProps) {
  return (
    <TabsContent value="chats" className="animate-fade-in">
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 border-2 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/30 to-accent/30">
            <CardTitle className="flex items-center justify-between">
              <span>Все беседы</span>
              <Button size="icon" variant="ghost" className="rounded-full hover:bg-card/50">
                <Icon name="Plus" size={20} />
              </Button>
            </CardTitle>
          </CardHeader>
          <ScrollArea className="h-[500px]">
            <CardContent className="p-2">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-4 rounded-xl mb-2 transition-all hover:bg-muted ${
                    selectedChat?.id === chat.id ? 'bg-primary/20 shadow-md' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-secondary">
                      <AvatarFallback className="bg-accent">
                        {chat.isGroup ? <Icon name="Users" size={20} /> : chat.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{chat.name}</p>
                        {chat.unread > 0 && (
                          <Badge className="bg-destructive text-destructive-foreground rounded-full">
                            {chat.unread}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </ScrollArea>
        </Card>

        <Card className="lg:col-span-2 border-2 rounded-2xl overflow-hidden">
          {selectedChat ? (
            <>
              <CardHeader className="bg-gradient-to-r from-secondary/30 to-accent/30">
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-primary">
                    <AvatarFallback className="bg-accent">
                      {selectedChat.isGroup ? <Icon name="Users" size={20} /> : selectedChat.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {selectedChat.name}
                </CardTitle>
              </CardHeader>
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === currentUser.id;
                    const sender = users.find(u => u.id === msg.senderId);
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8 border-2 border-secondary">
                          <AvatarFallback className="bg-accent text-xs">{sender?.initials}</AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
                          <div
                            className={`rounded-2xl p-3 ${
                              isOwn
                                ? 'bg-gradient-to-r from-primary to-secondary text-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p>{msg.text}</p>
                            {msg.hasImage && (
                              <div className="mt-2 bg-background/50 rounded-xl p-8 text-center text-3xl">
                                📷
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 px-2">{msg.timestamp}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              <CardContent className="pt-4 border-t">
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" className="rounded-full hover:scale-105 transition-transform duration-200">
                    <Icon name="Paperclip" size={20} />
                  </Button>
                  <Input
                    placeholder="Написать сообщение..."
                    className="flex-1 rounded-full border-2"
                  />
                  <Button size="icon" className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                    <Icon name="Send" size={20} />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="h-[500px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Выберите беседу для начала общения</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </TabsContent>
  );
}
