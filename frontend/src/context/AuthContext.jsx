import { createContext, useContext, useEffect, useState } from 'react';

import * as authApi from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaura a sessão ao abrir o app (cookie httpOnly → GET /auth/me; o
  // client renova com o refresh token automaticamente se preciso).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await authApi.me();
        if (alive) setUser(data.user);
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function login(email, password) {
    const data = await authApi.login(email, password);
    setUser(data.user);
  }

  async function register(fields) {
    const data = await authApi.register(fields);
    setUser(data.user);
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }

  async function updateProfile(fields) {
    const data = await authApi.updateProfile(fields);
    setUser(data.user);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
