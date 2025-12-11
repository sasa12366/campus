import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { BookOpen, Settings, User, LogOut } from "lucide-react";
import { Link } from "react-router-dom";

interface HeaderProps {
  userRole: 'student' | 'admin';
  isAuthenticated: boolean;
  onRoleChange: (role: 'student' | 'admin') => void;
  onLoginClick: () => void;
  onLogout: () => void;
}

export function Header({ userRole, isAuthenticated, onRoleChange, onLoginClick, onLogout }: HeaderProps) {
  return (
    <header className="bg-gradient-primary border-b shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* CampusFlow Logo */}
            <Link to="/" aria-label="На главную" className="flex items-center gap-2 md:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-md">
              <Logo variant="minimal" size="md" className="text-white md:w-8 md:h-8 transition-transform group-hover:scale-105" />
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-white">CampusFlow</h1>
                <p className="text-xs md:text-sm text-white/80">Система управления расписанием</p>
              </div>
            </Link>
          </div>

          {/* User Role Toggle */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-1 md:gap-2">
              <span className="text-xs md:text-sm text-white/80 hidden sm:inline">Роль:</span>
              <Badge 
                variant={userRole === 'admin' ? 'default' : 'secondary'}
                className="bg-white/20 text-white border-white/30 text-xs"
              >
                <User className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">{userRole === 'student' ? 'Студент' : 'Администратор'}</span>
                <span className="sm:hidden">{userRole === 'student' ? 'С' : 'А'}</span>
              </Badge>
              {userRole === 'admin' && isAuthenticated && (
                <Badge className="bg-green-500/20 text-white border-green-400/30 text-xs hidden md:inline-flex">
                  Авторизован
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1 md:gap-2">
              {userRole === 'student' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLoginClick}
                  className="border-white/50 text-white bg-white/10 hover:bg-white/20 hover:text-white hover:border-white/70 text-xs md:text-sm px-2 md:px-3"
                >
                  <Settings className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                  <span className="hidden md:inline">Войти как админ</span>
                </Button>
              ) : (
                <>
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onLogout}
                      className="border-white/50 text-white bg-white/10 hover:bg-white/20 hover:text-white hover:border-white/70 text-xs md:text-sm px-2 md:px-3"
                    >
                      <LogOut className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                      <span className="hidden md:inline">Выйти</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRoleChange('student')}
                    className="border-white/50 text-white bg-white/10 hover:bg-white/20 hover:text-white hover:border-white/70 text-xs md:text-sm px-2 md:px-3"
                  >
                    <User className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                    <span className="hidden md:inline">Режим студента</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}