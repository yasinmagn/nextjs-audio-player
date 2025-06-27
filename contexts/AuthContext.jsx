import React, { createContext, useContext, useState, useEffect } from 'react';
import { config, debugLog } from '../utils/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem(config.auth.tokenKey);
    if (token) {
      debugLog('Found existing token, validating...');
      setAuthToken(token);
      validateToken(token);
    } else {
      debugLog('No existing token found');
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      debugLog('Validating token with server...');
      const response = await fetch(`${config.apiBaseUrl}/user/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        debugLog('Token validation successful', userData);
        setUser(userData);
      } else {
        debugLog('Token validation failed:', response.status);
        // Token is invalid, clear it
        logout();
      }
    } catch (err) {
      debugLog('Token validation error:', err);
      // Network error or other issue, clear token
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (token, userData) => {
    debugLog('User logged in successfully');
    setAuthToken(token);
    setUser(userData);
    localStorage.setItem(config.auth.tokenKey, token);
  };

  const logout = () => {
    debugLog('User logged out');
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem(config.auth.tokenKey);
  };

  const value = {
    authToken,
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!authToken,
    config: config // Expose config to components
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
