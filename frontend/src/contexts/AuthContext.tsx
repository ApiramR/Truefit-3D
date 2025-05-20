import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (token: string, username: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      const storedUsername = localStorage.getItem('username');
      
      if (token && storedUsername) {
        try {
          // Verify token by making a request to get profile
          await authApi.getProfile();
          setIsAuthenticated(true);
          setUsername(storedUsername);
        } catch (error) {
          // If token is invalid, clear everything
          console.error('Token validation failed:', error);
          setIsAuthenticated(false);
          setUsername(null);
          localStorage.removeItem('token');
          localStorage.removeItem('username');
        }
      } else {
        // If no token or username, ensure we're logged out
        setIsAuthenticated(false);
        setUsername(null);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
      }
    };

    validateToken();
  }, []);

  const login = async (token: string, username: string) => {
    try {
      // Store token and username
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      
      // Update state
      setIsAuthenticated(true);
      setUsername(username);
    } catch (error) {
      console.error('Login error:', error);
      // If there's an error, ensure we're logged out
      logout();
      throw error;
    }
  };

  const logout = () => {
    // Clear storage
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    
    // Update state
    setIsAuthenticated(false);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, logout }}>
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