import { queryOptions, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "./notifications-api";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (userId?: number) => ["notifications", "list", userId ?? "anonymous"] as const,
};

export const notificationQueries = {
  list: (userId?: number) =>
    queryOptions({
      queryKey: notificationKeys.list(userId),
      queryFn: fetchNotifications,
      staleTime: 15_000,
      refetchInterval: 30_000,
      enabled: typeof userId === "number",
    }),
};

export function invalidateNotifications(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useNotifications(userId?: number) {
  return useQuery(notificationQueries.list(userId));
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return async (id: number) => {
    await markNotificationRead(id);
    await invalidateNotifications(queryClient);
  };
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return async () => {
    await markAllNotificationsRead();
    await invalidateNotifications(queryClient);
  };
}
