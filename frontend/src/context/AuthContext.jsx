import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('canteen_token'));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await axiosInstance.get('/auth/profile');
      setUser(data);
    } catch {
      setToken(null);
      localStorage.removeItem('canteen_token');
      localStorage.removeItem('canteen_user');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = (userData, tokenVal) => {
    setToken(tokenVal);
    setUser(userData);
    localStorage.setItem('canteen_token', tokenVal);
    localStorage.setItem('canteen_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('canteen_token');
    localStorage.removeItem('canteen_user');
  };

  const updateFavorites = (favorites) => {
    setUser((prev) => ({ ...prev, favorites }));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateFavorites }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
