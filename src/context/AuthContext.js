import { createContext, useContext, useState, useCallback } from 'react';

const AuthCtx = createContext(null);

/* ─── STORAGE HELPERS ─── */
const STORAGE_KEY = 'pi_session';
function loadSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? null; }
  catch { return null; }
}
function saveSession(user) { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); }
function clearSession()    { localStorage.removeItem(STORAGE_KEY); }

/* ─── PROVIDER ─── */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadSession());

  const login = useCallback((userData) => {
    const session = {
      name:    userData.name    || userData.email.split('@')[0],
      email:   userData.email,
      picture: userData.picture || null,
      loginAt: Date.now(),
    };
    saveSession(session);
    setUser(session);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
