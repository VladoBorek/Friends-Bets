import { createContext, useContext } from "react";
import type { UserSummary } from "../../../shared/src/schemas/user";

export interface AuthState {
  user: UserSummary | null;
  isLoading: boolean;
  refreshUser: () => Promise<UserSummary | null>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
