import React, { useState, useCallback, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import * as userService from '../services/userService';
import * as analyticsService from '../services/analyticsService';

const STORAGE_KEY = 'samagama_auth';
const TOKEN_KEY = 'samagama_token';
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = !!currentUser;
  const userRole = currentUser?.role || null;
  const isAdmin = userRole === 'admin';

  // Initialize and verify user from stored token on mount
  useEffect(() => {
    async function verifyToken() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
          // Token is invalid/expired
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(STORAGE_KEY);
          setCurrentUser(null);
        }
      } catch (e) {
        console.error("Token verification error:", e);
        // On network error, fallback to stored user to keep UI responsive
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) setCurrentUser(JSON.parse(stored));
        } catch {}
      } finally {
        setIsLoading(false);
      }
    }

    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    if (!email || !password) throw new Error('Email and password are required.');

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Invalid email or password.');
    }

    const data = await res.json();
    const token = data.access_token;
    const user = data.user;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);

    // Sync with local userService cache for metrics
    userService.registerUser(user);
    userService.updateLastActive(user.id);

    analyticsService.logActivity({
      userId: user.id,
      userName: user.name,
      email: user.email,
      action: 'login',
      interactionType: 'auth',
    });

    return user;
  }, []);

  const signup = useCallback(async (name, email, password, confirmPassword) => {
    if (!name || !email || !password) throw new Error('All fields are required.');
    if (password !== confirmPassword) throw new Error('Passwords do not match.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');

    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password, role: 'student' })
    });

    if (!registerRes.ok) {
      const errorData = await registerRes.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Registration failed.');
    }

    // Automatically login after successful signup
    return login(email, password);
  }, [login]);

  const adminLogin = useCallback(async (email, password) => {
    if (!email || !password) throw new Error('Email and password are required.');

    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Invalid administrator credentials.');
    }

    const data = await res.json();
    const token = data.access_token;
    const admin = data.user;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
    setCurrentUser(admin);

    analyticsService.logActivity({
      userId: admin.id,
      userName: admin.name,
      email: admin.email,
      action: 'admin_login',
      interactionType: 'auth',
    });

    return admin;
  }, []);

  const logout = useCallback(() => {
    if (currentUser) {
      analyticsService.logActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        email: currentUser.email,
        action: 'logout',
        interactionType: 'auth',
      });
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
    setPendingAction(null);
  }, [currentUser]);

  const openAuth = useCallback((action = null) => {
    if (action) setPendingAction(() => action);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    setPendingAction(null);
  }, []);

  const value = {
    currentUser,
    userRole,
    isLoggedIn,
    isAdmin,
    isLoading,
    login,
    signup,
    adminLogin,
    logout,
    openAuth,
    closeAuth,
    authOpen,
    pendingAction,
    setPendingAction,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
