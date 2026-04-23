import { useState, useEffect, useMemo } from "react";
import type { UserSummary } from "@pb138/shared/schemas/user";

export function useUsers() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/users/admin/users");
      if (res.ok) {
        const json = (await res.json()) as { data: UserSummary[] };
        setUsers(json.data);
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users
      .filter((entry) => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return true;

        return (
          entry.username.toLowerCase().includes(normalizedQuery) ||
          entry.email.toLowerCase().includes(normalizedQuery) ||
          (entry.roleName ?? "").toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => {
        if (a.roleName === "ADMIN" && b.roleName !== "ADMIN") return -1;
        if (a.roleName !== "ADMIN" && b.roleName === "ADMIN") return 1;
        return a.username.localeCompare(b.username);
      });
  }, [users, query]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.roleName === "ADMIN").length;
    return {
      total,
      admins,
      standard: total - admins,
    };
  }, [users]);

  const performAction = async (
    endpoint: string,
    method: string,
    body?: any,
    successMessage?: string
  ) => {
    setFeedback(null);
    try {
      const res = await fetch(endpoint, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        setFeedback({ type: "error", message: data.message ?? "Action failed" });
        return false;
      }

      setFeedback({ type: "success", message: successMessage ?? data.message ?? "Action successful" });
      await fetchUsers();
      return true;
    } catch (e) {
      setFeedback({ type: "error", message: "Network error occurred" });
      return false;
    }
  };

  const deleteUser = (user: UserSummary) => 
    performAction(`/api/users/admin/users/${user.id}`, "DELETE", undefined, `User ${user.username} deleted.`);

  const updateRole = (user: UserSummary, roleName: string) => 
    performAction(`/api/users/admin/users/${user.id}/role`, "PATCH", { roleName }, `Role updated for ${user.username}.`);

  const suspendUser = (user: UserSummary, durationValue: number, durationUnit: string) => 
    performAction(`/api/users/admin/users/${user.id}/suspend`, "PATCH", { durationValue, durationUnit }, `User ${user.username} suspended.`);

  const unsuspendUser = (user: UserSummary) => 
    performAction(`/api/users/admin/users/${user.id}/unsuspend`, "PATCH", undefined, `User ${user.username} unsuspended.`);

  const resendVerification = (user: UserSummary) => 
    performAction(`/api/users/admin/users/${user.id}/resend-verification`, "POST", undefined, `Verification email resent to ${user.email}.`);

  const resetPassword = (user: UserSummary) => 
    performAction(`/api/users/admin/users/${user.id}/reset-password`, "POST", undefined, `Password reset email sent to ${user.email}.`);

  return {
    users: filteredUsers,
    allUsers: users,
    isLoading,
    query,
    setQuery,
    feedback,
    setFeedback,
    stats,
    actions: {
      deleteUser,
      updateRole,
      suspendUser,
      unsuspendUser,
      resendVerification,
      resetPassword,
      refresh: fetchUsers
    }
  };
}
