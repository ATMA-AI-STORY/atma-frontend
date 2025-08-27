import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User, AuthState } from '../lib/auth';

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const refreshUser = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const user = await authService.getCurrentUser();
      setAuthState({
        user,
        isAuthenticated: user !== null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async () => {
    await authService.login();
  };

  const logout = async () => {
    await authService.logout();
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  // Check authentication status on mount
  useEffect(() => {
    refreshUser();
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
