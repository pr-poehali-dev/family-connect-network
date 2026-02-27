import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type AppNavProps = {
  siteName: string;
  userName: string;
  userInitials: string;
  onLogout: () => void;
};

function AlphaLogo() {
  return (
    <div className="w-10 h-10 bg-white rounded-md grid place-items-center relative overflow-hidden">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="relative z-10">
        <path d="M12 3L4 21h3.5l1.5-3.5h6l1.5 3.5H20L12 3zm0 5.5L14.5 15h-5L12 8.5z" fill="hsl(0, 89%, 40%)" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
    </div>
  );
}

export default function AppNav({ siteName, userName, userInitials, onLogout }: AppNavProps) {
  return (
    <nav className="sticky top-0 z-50 bg-primary shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlphaLogo />
            <h1 className="text-2xl font-bold text-white tracking-tight">{siteName}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="w-9 h-9 border-2 border-white/40">
                <AvatarFallback className="bg-white/20 text-white text-sm font-medium">{userInitials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-white hidden sm:inline">{userName}</span>
            </div>
            <Button size="icon" variant="ghost" onClick={onLogout} className="text-white/70 hover:text-white hover:bg-white/10 rounded-full">
              <Icon name="LogOut" size={18} />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
