/**
 * Authentication Hook
 * Manages user authentication state and operations
 */
import { useState, useCallback } from 'react';
import { authService } from '../services/api';
import { getLocalDateString } from '../utils/dateHelpers';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedLogin = sessionStorage.getItem('isLoggedIn');
    return savedLogin === 'true';
  });
  
  const [currentUserData, setCurrentUserData] = useState(() => {
    const savedUser = sessionStorage.getItem('currentUserData');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = useCallback(async () => {
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      const data = await authService.login(username, password);
      setIsLoggedIn(true);
      setCurrentUserData(data.user);
      setPassword(''); // Clear password for security
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Username atau password salah!';
      setLoginError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoggingIn(false);
    }
  }, [username, password]);

  const handleLogout = useCallback(() => {
    authService.logout();
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setLoginError('');
    setCurrentUserData(null);
  }, []);

  return {
    // State
    isLoggedIn,
    currentUserData,
    username,
    password,
    showPassword,
    loginError,
    isLoggingIn,
    
    // Setters
    setUsername,
    setPassword,
    setShowPassword,
    setCurrentUserData,
    
    // Actions
    handleLogin,
    handleLogout
  };
};
