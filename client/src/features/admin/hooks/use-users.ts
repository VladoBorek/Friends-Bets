import { useCallback, useEffect, useMemo, useState } from "react";
import { listUsersResponseSchema, type UserSummary } from "@pb138/shared/schemas/user";
import { extractApiErrorMessage, readJsonResponse } from "../../../api/http";

const ADMIN_USERS_PAGE_SIZE = 10;

export type SuspensionUnit = "hours" | "days" | "months";

type PaginationState = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export interface UserActions {
  deleteUser: (user: UserSummary) => Promise<boolean>;
  updateRole: (user: UserSummary, roleName: string) => Promise<boolean>;
  suspendUser: (user: UserSummary, durationValue: number, durationUnit: SuspensionUnit) => Promise<boolean>;
  unsuspendUser: (user: UserSummary) => Promise<boolean>;
  resendVerification: (user: UserSummary) => Promise<boolean>;
  resetPassword: (user: UserSummary) => Promise<boolean>;
  refresh: () => Promise<void>;
}

async function fetchAdminUsersPage(page: number) {
  const params = new URLSearchParams({
    limit: String(ADMIN_USERS_PAGE_SIZE),
    offset: String((page - 1) * ADMIN_USERS_PAGE_SIZE),
  });

  const response = await fetch(`/api/users/admin/users?${params.toString()}`, {
    credentials: "same-origin",
  });

  const json = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(extractApiErrorMessage(json, "Unable to load users"));
  }

  return listUsersResponseSchema.parse(json);
}

async function fetchAllAdminUsers() {
  const users: UserSummary[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    const response = await fetch(`/api/users/admin/users?${params.toString()}`, {
      credentials: "same-origin",
    });

    const json = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(extractApiErrorMessage(json, "Unable to load users"));
    }

    const page = listUsersResponseSchema.parse(json);
    users.push(...page.data);

    if (!page.pagination.hasMore) break;
    offset += page.pagination.limit;
  }

  return users;
}

function sortUsers(users: UserSummary[]) {
  return [...users].sort((a, b) => {
    if (a.roleName === "ADMIN" && b.roleName !== "ADMIN") return -1;
    if (a.roleName !== "ADMIN" && b.roleName === "ADMIN") return 1;
    return a.username.localeCompare(b.username);
  });
}

export function useUsers(initialPage = 1) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [page, setPageState] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQueryState] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setPageState(initialPage);
  }, [initialPage]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);

    try {
      const [pageResult, allResult] = await Promise.all([
        fetchAdminUsersPage(page),
        fetchAllAdminUsers(),
      ]);

      setUsers(sortUsers(pageResult.data));
      setPagination(pageResult.pagination);
      setAllUsers(sortUsers(allResult));
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load users",
      });
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const setQuery = (nextQuery: string) => {
    setQueryState(nextQuery);
    setPageState(1);
  };

  const filteredAllUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return allUsers;
    }

    return allUsers.filter((entry) => (
      entry.username.toLowerCase().includes(normalizedQuery) ||
      entry.email.toLowerCase().includes(normalizedQuery) ||
      (entry.roleName ?? "").toLowerCase().includes(normalizedQuery)
    ));
  }, [allUsers, query]);

  const visibleUsers = useMemo(() => {
    if (!query.trim()) {
      return users;
    }

    const start = (page - 1) * ADMIN_USERS_PAGE_SIZE;
    return filteredAllUsers.slice(start, start + ADMIN_USERS_PAGE_SIZE);
  }, [filteredAllUsers, page, query, users]);

  const visiblePagination = useMemo<PaginationState | null>(() => {
    if (!query.trim()) {
      return pagination;
    }

    return {
      total: filteredAllUsers.length,
      limit: ADMIN_USERS_PAGE_SIZE,
      offset: (page - 1) * ADMIN_USERS_PAGE_SIZE,
      hasMore: page * ADMIN_USERS_PAGE_SIZE < filteredAllUsers.length,
    };
  }, [filteredAllUsers.length, page, pagination, query]);

  const totalPages = visiblePagination
    ? Math.max(1, Math.ceil(visiblePagination.total / visiblePagination.limit))
    : 1;

  useEffect(() => {
    if (visiblePagination && page > totalPages) {
      setPageState(totalPages);
    }
  }, [page, totalPages, visiblePagination]);

  const stats = useMemo(() => {
    const total = allUsers.length;
    const admins = allUsers.filter((u) => u.roleName === "ADMIN").length;

    return {
      total,
      admins,
      standard: total - admins,
    };
  }, [allUsers]);

  const performAction = async (
    endpoint: string,
    method: string,
    body?: Record<string, unknown>,
    successMessage?: string,
  ) => {
    setFeedback(null);

    try {
      const res = await fetch(endpoint, {
        method,
        credentials: "same-origin",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await readJsonResponse(res);

      if (!res.ok) {
        setFeedback({ type: "error", message: extractApiErrorMessage(data, "Action failed") });
        return false;
      }

      setFeedback({ type: "success", message: successMessage ?? "Action successful" });
      await fetchUsers();

      return true;
    } catch {
      setFeedback({ type: "error", message: "Network error occurred" });
      return false;
    }
  };

  const deleteUser = (user: UserSummary) =>
    performAction(`/api/users/admin/users/${user.id}`, "DELETE", undefined, `User ${user.username} deleted.`);

  const updateRole = (user: UserSummary, roleName: string) =>
    performAction(`/api/users/admin/users/${user.id}/role`, "PATCH", { roleName }, `Role updated for ${user.username}.`);

  const suspendUser = (user: UserSummary, durationValue: number, durationUnit: SuspensionUnit) =>
    performAction(`/api/users/admin/users/${user.id}/suspend`, "PATCH", { durationValue, durationUnit }, `User ${user.username} suspended.`);

  const unsuspendUser = (user: UserSummary) =>
    performAction(`/api/users/admin/users/${user.id}/unsuspend`, "PATCH", undefined, `User ${user.username} unsuspended.`);

  const resendVerification = (user: UserSummary) =>
    performAction(`/api/users/admin/users/${user.id}/resend-verification`, "POST", undefined, `Verification email resent to ${user.email}.`);

  const resetPassword = (user: UserSummary) =>
    performAction(`/api/users/admin/users/${user.id}/reset-password`, "POST", undefined, `Password reset email sent to ${user.email}.`);

  const actions: UserActions = {
    deleteUser,
    updateRole,
    suspendUser,
    unsuspendUser,
    resendVerification,
    resetPassword,
    refresh: fetchUsers,
  };

  return {
    users: visibleUsers,
    allUsers,
    isLoading,
    query,
    setQuery,
    feedback,
    setFeedback,
    stats,
    pagination: visiblePagination,
    page,
    totalPages,
    setPage: setPageState,
    actions,
  };
}