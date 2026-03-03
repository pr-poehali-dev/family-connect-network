import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

type PendingScreenProps = {
  userName: string;
  onLogout: () => void;
  siteName?: string;
};

export default function PendingScreen({ userName, onLogout, siteName = 'Альфа Семья' }: PendingScreenProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-white text-center py-8 flex flex-col items-center">
          <div className="w-16 h-16 bg-white/10 rounded-lg grid place-items-center relative overflow-hidden">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="relative z-10">
              <path d="M12 3L4 21h3.5l1.5-3.5h6l1.5 3.5H20L12 3zm0 5.5L14.5 15h-5L12 8.5z" fill="white" />
            </svg>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30" />
          </div>
          <h1 className="text-2xl font-bold mt-4">{siteName}</h1>
        </CardHeader>
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full grid place-items-center mx-auto mb-4">
            <Icon name="Clock" size={40} className="text-orange-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Заявка на рассмотрении</h2>
          <p className="text-muted-foreground mb-2">
            Здравствуйте, <strong>{userName}</strong>!
          </p>
          <p className="text-muted-foreground mb-6">
            Ваша заявка на вступление находится на модерации у администратора. Мы уведомим вас, когда она будет одобрена.
          </p>
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
              <p className="text-sm font-medium text-muted-foreground">Ожидание одобрения...</p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="rounded-md"
          >
            <Icon name="LogOut" size={16} className="mr-2" /> Выйти
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}