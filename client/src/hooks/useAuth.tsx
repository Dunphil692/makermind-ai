import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clearAuth,
  getCurrentUser,
  installLegacyAuthBridge,
  isLoggedIn,
  setAuth,
  type AuthUser
} from "../lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loggedIn: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());

  const refresh = () => {
    setUser(getCurrentUser());
    setLoggedIn(isLoggedIn());
  };

  const login = (token: string, nextUser: AuthUser) => {
    setAuth(token, nextUser);
    refresh();
  };

  const logout = () => {
    clearAuth();
    refresh();
  };

  useEffect(() => {
    installLegacyAuthBridge();
  }, [user, loggedIn]);

  const value = useMemo(
    () => ({ user, loggedIn, login, logout, refresh }),
    [user, loggedIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
