import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/schedule';
import { api } from '@/lib/api';

interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      console.log('[UserContext] Получение текущего пользователя...');
      const user = await api.getCurrentUser();
      console.log('[UserContext] Полученный пользователь:', user);
      setCurrentUser(user);
    } catch (error) {
      console.error('[UserContext] Ошибка получения пользователя:', error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <UserContext.Provider value={{ currentUser, isLoading, isAdmin, isSuperAdmin, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

