import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8081';
export const PROJECT_SERVICE_URL = import.meta.env.VITE_PROJECT_SERVICE_URL || 'http://localhost:8082';

// Pre-configured axios instance that routes to the appropriate service and includes JWT token
export const api = axios.create();

api.interceptors.request.use(
  (config) => {
    // Intelligent routing to the 2 backend services
    const url = config.url || '';
    if (url.startsWith('/api/projects') || url.startsWith('/api/applications')) {
      config.baseURL = PROJECT_SERVICE_URL;
    } else {
      config.baseURL = USER_SERVICE_URL;
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${USER_SERVICE_URL}/api/auth/login`, { email, password });
      const { token, id, name, role, privileges } = response.data;

      const loggedUser = { id, name, email, role, privileges: privileges || [] };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return loggedUser;
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to login');
    }
  };

  const register = async (userData) => {
    try {
      await axios.post(`${USER_SERVICE_URL}/api/auth/register`, userData);
    } catch (error) {
      throw new Error(error.response?.data || 'Failed to register');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
