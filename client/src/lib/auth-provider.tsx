import React, { useEffect, useState, useCallback, useRef } from "react";
import type { UserSummary } from "@pb138/shared/schemas/user";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isBootstrapped = useRef(false);

  const fetchMe = useCallback(async (): Promise<UserSummary | null> => {
    if (!isBootstrapped.current) {
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
      isBootstrapped.current = true;
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/users/logout", { method: "POST" });
    setUser(null);
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser: fetchMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
