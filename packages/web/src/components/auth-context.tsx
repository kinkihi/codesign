"use client";

import * as React from "react";

interface AuthContextValue {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "codesign-auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setIsLoggedIn(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const login = React.useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIsLoggedIn(true);
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsLoggedIn(false);
  }, []);

  if (isLoggedIn === null) return null;

  return (
    <AuthContext value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
