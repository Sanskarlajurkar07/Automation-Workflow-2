import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('token'));
  });
  const [isLoading, setIsLoading] = useState(true);

  const validateToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      await api.get('/auth/validate');
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only validate on mount
    validateToken();
  }, [validateToken]);

  const login = useCallback((token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('isLoggedIn', 'true');
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    setIsAuthenticated(false);
    setIsLoading(false);
  }, []);

  return { isAuthenticated, isLoading, login, logout };
};