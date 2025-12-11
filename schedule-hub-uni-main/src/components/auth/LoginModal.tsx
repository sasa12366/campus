import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, User, AlertTriangle, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (token: string) => void;
}

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<boolean | null>(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ 
    firstName: '', 
    lastName: '', 
    middleName: '',
    email: '', 
    password: '',
    group_number: '',
    subgroup_number: '',
    info: 'Администратор системы',
    role: 'ADMIN'
  });

  // Проверяем состояние API при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      checkApiStatus();
    }
  }, [isOpen]);

  const checkApiStatus = async () => {
    const status = await api.checkHealth();
    setApiStatus(status);
    if (!status) {
      setError('Бэкенд недоступен. Убедитесь, что сервер запущен на порту 8081.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.authenticate(loginData);
      const token = data.accessToken || data.access_token || data.token;
      const refresh = data.refreshToken || data.refresh_token;
      
      // Сохраняем токен в localStorage через API
      api.setAuthToken(token, refresh);
      
      onLogin(token);
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      console.log('Отправляем данные регистрации:', registerData);
      const data = await api.register(registerData);
      console.log('Ответ сервера:', data);
      console.log('Администратор успешно зарегистрирован!');
      api.setAuthToken(data.accessToken || data.access_token || data.token, data.refreshToken || data.refresh_token);
      onLogin(data.accessToken || data.access_token || data.token);
      onClose();
    } catch (err) {
      console.error('Register error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 sm:mx-auto w-[calc(100vw-2rem)] sm:w-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Вход для администраторов
            </div>
            <div className="flex items-center gap-2 text-sm">
              {apiStatus === null && <Loader2 className="h-4 w-4 animate-spin" />}
              {apiStatus === true && <CheckCircle className="h-4 w-4 text-green-500" />}
              {apiStatus === false && <AlertTriangle className="h-4 w-4 text-red-500" />}
              <span className="text-xs text-muted-foreground">
                {apiStatus === null ? 'Проверка...' : apiStatus ? 'API доступен' : 'API недоступен'}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Войти
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-700">
                <strong>Регистрация администратора</strong><br/>
                Вы регистрируетесь с правами администратора системы
              </p>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-firstname">Имя</Label>
                  <Input
                    id="register-firstname"
                    placeholder="Иван"
                    value={registerData.firstName}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-lastname">Фамилия</Label>
                  <Input
                    id="register-lastname"
                    placeholder="Иванов"
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-middlename">Отчество</Label>
                <Input
                  id="register-middlename"
                  placeholder="Иванович"
                  value={registerData.middleName}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, middleName: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Пароль</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Зарегистрироваться
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 