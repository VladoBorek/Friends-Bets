import { listNotificationsResponseSchema, markReadResponseSchema } from "@pb138/shared/schemas/notifications";
import { readJsonOrThrow } from "../http";

export async function fetchNotifications() {
  const response = await fetch("/api/notifications", {
    method: "GET",
    credentials: "same-origin",
  });

  return listNotificationsResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load notifications"),
  );
}

export async function markNotificationRead(id: number) {
  const response = await fetch(`/api/notifications/${id}/read`, {
    method: "PATCH",
    credentials: "same-origin",
  });

  return markReadResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to mark notification as read"),
  );
}

export async function markAllNotificationsRead() {
  const response = await fetch("/api/notifications/read-all", {
    method: "PATCH",
    credentials: "same-origin",
  });

  return markReadResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to mark all notifications as read"),
  );
}
