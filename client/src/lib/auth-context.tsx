import React, { createContext, useContext, useEffect, useState } from "react";
import type { UserSummary } from "@pb138/shared/schemas/user";

interface AuthState {
  user: UserSummary | null;
  isLoading: boolean;
  refreshUser: () => Promise<UserSummary | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  const fetchMe = async (): Promise<UserSummary | null> => {
    if (!isBootstrapped) {
      setIsLoading(true);
    }
    try {
      // Assuming relative /api based on Vite proxy or Kubb client config
      const res = await fetch("/api/users/me");
      if (res.ok) {
        const json = await res.json();
        setUser(json.data);
        return json.data as UserSummary;
      } else {
        setUser(null);
        return null;
      }
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
      setIsBootstrapped(true);
    }
  };

  const logout = async () => {
    await fetch("/api/users/logout", { method: "POST" });
    setUser(null);
  };

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser: fetchMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
