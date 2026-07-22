// Auth controller — Phase 2. Holds the current user + role in memory.
// Backed by mocks/users.js (credential check) and mocks/data.js (user record).
// Will be replaced with real token/session logic in Phase 7.
//
// Two login entry points:
//   - loginWithCredentials(email, password): real auth flow used by Login view
//   - login(role): Phase 1 role switcher, kept ONLY for the in-NavShell preview;
//     will be removed once Phase 2's role-based redirect is exercised.
import { useMemo, useState, useEffect } from 'react';
import { USER_ROLES } from '../models';
import { AuthCtx } from './authContext.js';
import { fetchApi } from '../api/client.js';

export function AuthProvider({ children }) {
  // Start logged-out. We restore from localStorage below.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a saved user session
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // Listen for the global session:expired event emitted by fetchApi on 401.
  // Sets user to null → RequireAuth immediately redirects to /login.
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener('session:expired', handleExpired);
    return () => window.removeEventListener('session:expired', handleExpired);
  }, []);

  /** Real auth flow pointing to Go Backend */
  async function loginWithCredentials(email, password) {
    try {
      const res = await fetchApi('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Store JWT token and user info
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      
      setUser(res.user);
      return { ok: true, user: res.user };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isSuperadmin: user?.role === USER_ROLES.SUPERADMIN,
      isProfessor: user?.role === USER_ROLES.PROFESSOR,
      loginWithCredentials,
      logout,
    }),
    [user],
  );

  // Don't render until we have checked localStorage
  if (loading) return null;

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
