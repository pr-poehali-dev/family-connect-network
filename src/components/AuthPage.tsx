import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import api from '@/lib/api';

type AuthPageProps = {
  onAuth: (user: Record<string, unknown>) => void;
};

function AlphaLogo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const s = size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
  const svgSize = size === 'lg' ? 32 : 24;
  return (
    <div className={`${s} bg-primary rounded-lg grid place-items-center relative overflow-hidden`}>
      <svg width={svgSize} height={svgSize} viewBox="0 0 24 24" fill="none" className="relative z-10">
        <path d="M12 3L4 21h3.5l1.5-3.5h6l1.5 3.5H20L12 3zm0 5.5L14.5 15h-5L12 8.5z" fill="white" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-red-600" />
    </div>
  );
}

export default function AuthPage({ onAuth }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [regMethod, setRegMethod] = useState<'phone' | 'login'>('phone');

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('+7');
  const [regLogin, setRegLogin] = useState('U_');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async () => {
    setLoginError('');
    if (!loginIdentifier || !loginPassword) {
      setLoginError('Заполните все поля');
      return;
    }

    setLoginLoading(true);
    try {
      const user = await api.login(loginIdentifier, loginPassword);
      localStorage.setItem('alfa_user', JSON.stringify(user));
      onAuth(user);
    } catch (e: unknown) {
      setLoginError(e instanceof Error ? e.message : 'Ошибка входа');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegError('');
    if (!regName || !regPassword) {
      setRegError('Заполните имя и пароль');
      return;
    }
    if (regMethod === 'phone') {
      const phoneClean = regPhone.replace(/\D/g, '');
      if (phoneClean.length < 11) {
        setRegError('Укажите корректный номер телефона');
        return;
      }
    }
    if (regMethod === 'login') {
      if (!regLogin.startsWith('U_') || regLogin.length < 4) {
        setRegError('Укажите верный рабочий логин (начинается с U_)');
        return;
      }
    }
    setRegLoading(true);
    try {
      await api.register(
        regName,
        regPassword,
        regMethod === 'phone' ? regPhone : '',
        regMethod === 'login' ? regLogin : ''
      );
      setRegSuccess(true);
    } catch (e: unknown) {
      setRegError(e instanceof Error ? e.message : 'Ошибка регистрации');
    } finally {
      setRegLoading(false);
    }
  };

  const handlePhoneInput = (value: string) => {
    let clean = value.replace(/[^\d+]/g, '');
    if (!clean.startsWith('+7')) clean = '+7' + clean.replace(/^\+?7?/, '');
    if (clean.length > 12) clean = clean.slice(0, 12);
    setRegPhone(clean);
  };

  const handleLoginInput = (value: string) => {
    if (!value.startsWith('U_')) value = 'U_' + value.replace(/^U_?/, '');
    setRegLogin(value);
  };

  if (regSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border rounded-lg overflow-hidden">
          <CardHeader className="bg-primary text-white text-center py-8">
            <AlphaLogo size="lg" />
            <h1 className="text-2xl font-bold mt-4">Альфа Семья</h1>
          </CardHeader>
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full grid place-items-center mx-auto mb-4">
              <Icon name="Clock" size={32} className="text-orange-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Заявка отправлена</h2>
            <p className="text-muted-foreground mb-6">
              Ваша заявка на регистрацию отправлена администратору. Вы сможете войти после одобрения.
            </p>
            <Button
              onClick={() => { setRegSuccess(false); setMode('login'); }}
              variant="outline"
              className="rounded-md"
            >
              Перейти ко входу
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border rounded-lg overflow-hidden">
        <CardHeader className="bg-primary text-white text-center py-8 flex flex-col items-center">
          <AlphaLogo size="lg" />
          <h1 className="text-2xl font-bold mt-4">Альфа Семья</h1>
          <p className="text-white/70 text-sm mt-1">Семейная социальная сеть</p>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 bg-muted rounded-md mb-6">
              <TabsTrigger value="login" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white">Вход</TabsTrigger>
              <TabsTrigger value="register" className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-white">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div>
                <Label>Телефон или логин</Label>
                <Input
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="+7... или U_..."
                  className="rounded-md border-2 mt-2"
                />
              </div>
              <div>
                <Label>Пароль</Label>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="rounded-md border-2 mt-2"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              {loginError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <Icon name="AlertCircle" size={14} /> {loginError}
                </p>
              )}
              <Button
                onClick={handleLogin}
                disabled={loginLoading}
                className="w-full rounded-md bg-primary text-white hover:bg-primary/90"
              >
                {loginLoading ? 'Вход...' : 'Войти'}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div>
                <Label>Ваше имя</Label>
                <Input
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Иван Иванов"
                  className="rounded-md border-2 mt-2"
                />
              </div>

              <div>
                <Label className="mb-2 block">Способ входа</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={regMethod === 'phone' ? 'default' : 'outline'}
                    onClick={() => setRegMethod('phone')}
                    className={`rounded-md text-sm ${regMethod === 'phone' ? 'bg-primary text-white' : ''}`}
                  >
                    <Icon name="Phone" size={16} className="mr-1" /> Телефон
                  </Button>
                  <Button
                    variant={regMethod === 'login' ? 'default' : 'outline'}
                    onClick={() => setRegMethod('login')}
                    className={`rounded-md text-sm ${regMethod === 'login' ? 'bg-primary text-white' : ''}`}
                  >
                    <Icon name="User" size={16} className="mr-1" /> Логин
                  </Button>
                </div>
              </div>

              {regMethod === 'phone' ? (
                <div>
                  <Label>Номер телефона</Label>
                  <Input
                    value={regPhone}
                    onChange={(e) => handlePhoneInput(e.target.value)}
                    placeholder="+7 999 123 45 67"
                    className="rounded-md border-2 mt-2"
                  />
                </div>
              ) : (
                <div>
                  <Label>Рабочий логин</Label>
                  <Input
                    value={regLogin}
                    onChange={(e) => handleLoginInput(e.target.value)}
                    placeholder="U_ivanov"
                    className="rounded-md border-2 mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Логин должен начинаться с U_</p>
                </div>
              )}

              <div>
                <Label>Пароль</Label>
                <Input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Придумайте пароль"
                  className="rounded-md border-2 mt-2"
                />
              </div>

              {regError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <Icon name="AlertCircle" size={14} /> {regError}
                </p>
              )}

              <Button
                onClick={handleRegister}
                disabled={regLoading}
                className="w-full rounded-md bg-primary text-white hover:bg-primary/90"
              >
                {regLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}