import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, ElderlyProfile } from '../types/auth';
import { api, setAuthTokens, clearAuthTokens } from '../services/api';

interface AuthContextType {
  user: User | null;
  elderlyProfile: ElderlyProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [elderlyProfile, setElderlyProfile] = useState<ElderlyProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('accessToken');
      const storedUser = await AsyncStorage.getItem('user');
      const storedProfile = await AsyncStorage.getItem('elderlyProfile');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedProfile) {
          setElderlyProfile(JSON.parse(storedProfile));
        }
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (emailOrPhone: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { emailOrPhone, password });
      const { user: loggedInUser, tokens } = response.data.data;

      await setAuthTokens(tokens.accessToken, tokens.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));

      setToken(tokens.accessToken);
      setUser(loggedInUser);

      // If user is elderly, fetch their profile
      if (loggedInUser.role === 'elderly') {
        try {
          const profileRes = await api.get('/elderly/profile');
          const profile = profileRes.data.data;
          setElderlyProfile(profile);
          await AsyncStorage.setItem('elderlyProfile', JSON.stringify(profile));
        } catch (profErr) {
          console.warn('Could not fetch elderly profile:', profErr);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.role === 'elderly') {
      try {
        const profileRes = await api.get('/elderly/profile');
        const profile = profileRes.data.data;
        setElderlyProfile(profile);
        await AsyncStorage.setItem('elderlyProfile', JSON.stringify(profile));
      } catch (e) {
        console.warn('Failed to refresh elderly profile', e);
      }
    }
  };

  const logout = async () => {
    try {
      await clearAuthTokens();
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('elderlyProfile');
      setUser(null);
      setElderlyProfile(null);
      setToken(null);
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        elderlyProfile,
        token,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
