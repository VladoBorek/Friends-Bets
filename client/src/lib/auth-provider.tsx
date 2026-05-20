import React, { useCallback, useEffect, useRef, useState } from "react";
import type { UserSummary } from "@pb138/shared/schemas/user";
import { getMeResponseSchema } from "@pb138/shared/schemas/user";
import { useQueryClient } from "@tanstack/react-query";
import { readJsonOrThrow } from "../api/http";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isBootstrapped = useRef(false);

  const fetchMe = useCallback(async (): Promise<UserSummary | null> => {
    if (!isBootstrapped.current) {
      setIsLoading(true);
    }

    try {
      const res = await fetch("/api/users/me", {
        credentials: "same-origin",
      });

      if (!res.ok) {
        setUser(null);
        return null;
      }

      const json = getMeResponseSchema.parse(
        await readJsonOrThrow(res, "Unable to load current user"),
      );

      setUser(json.data);
      return json.data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
      isBootstrapped.current = true;
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/users/logout", {
      method: "POST",
      credentials: "same-origin",
    });

    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser: fetchMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
}