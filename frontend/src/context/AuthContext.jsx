import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { tokenStorage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.get());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.get()));

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => null);
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    window.addEventListener('auth:expired', clearSession);
    return () => window.removeEventListener('auth:expired', clearSession);
  }, [clearSession]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    authApi
      .getProfile()
      .then((profile) => active && setUser(profile))
      .catch(() => null)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  const saveSession = useCallback((session) => {
    tokenStorage.set(session.token);
    setUser(session.user);
    setToken(session.token);
  }, []);

  const login = useCallback(async (credentials) => saveSession(await authApi.login(credentials)), [saveSession]);
  const register = useCallback(async (body) => saveSession(await authApi.register(body)), [saveSession]);

  const value = useMemo(
    () => ({ token, user, setUser, loading, isAuthenticated: Boolean(token), login, register, logout }),
    [token, user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
