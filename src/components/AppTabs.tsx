import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

type AppTabsProps = {
  isAdmin: boolean;
};

export default function AppTabs({ isAdmin }: AppTabsProps) {
  return (
    <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid bg-white p-1 rounded-lg border border-border shadow-sm">
      <TabsTrigger value="home" className="rounded-md gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
        <Icon name="Home" size={18} />
        <span className="hidden sm:inline">Главная</span>
      </TabsTrigger>
      <TabsTrigger value="chats" className="rounded-md gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
        <Icon name="MessageCircle" size={18} />
        <span className="hidden sm:inline">Беседы</span>
      </TabsTrigger>
      <TabsTrigger value="messages" className="rounded-md gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
        <Icon name="Send" size={18} />
        <span className="hidden sm:inline">Сообщения</span>
      </TabsTrigger>
      <TabsTrigger value="profile" className="rounded-md gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
        <Icon name="User" size={18} />
        <span className="hidden sm:inline">Профиль</span>
      </TabsTrigger>
      {isAdmin && (
        <TabsTrigger value="admin" className="rounded-md gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
          <Icon name="Shield" size={18} />
          <span className="hidden sm:inline">Админ</span>
        </TabsTrigger>
      )}
    </TabsList>
  );
}
