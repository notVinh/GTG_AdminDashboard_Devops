import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type User, type Role, ROLE } from '../types';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isAdmin: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  // Lấy role từ user
  const role = user?.role || null;
  const isAdmin = role === ROLE.FACTORY_ADMIN || role === ROLE.SUPER_ADMIN;
  const isEmployee = role === ROLE.EMPLOYEE || role === ROLE.EMPLOYEE_GTG;

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('employee_info');
    localStorage.removeItem('employee_permissions');
  };

  // Load user info từ localStorage khi component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user_info');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('user_info');
      }
    }
  }, []);

  // Lưu user info vào localStorage khi user thay đổi
  useEffect(() => {
    if (user) {
      localStorage.setItem('user_info', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_info');
    }
  }, [user]);

  const value = {
    user,
    role,
    setUser,
    logout,
    isAdmin,
    isEmployee,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
