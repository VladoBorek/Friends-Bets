import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/db";
import { Notification } from "../../db/schema";
import { HttpError } from "../../errors";
import { inAppChannel } from "./channels/in-app";
import type { CreateNotificationInput, NotificationChannel } from "./channels/types";
import { findWagerResolutionTargets } from "./discovery";

const activeChannels: NotificationChannel[] = [inAppChannel];
// To add email: import { emailChannel } from "./channels/email" and push to this array

export async function handleWagerResolved(wagerId: number): Promise<void> {
  const targets = await findWagerResolutionTargets(wagerId);
  for (const target of targets) {
    for (const channel of activeChannels) {
      await channel.deliver(target);
    }
  }
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  for (const channel of activeChannels) {
    await channel.deliver(input);
  }
}

export type NotificationRow = {
  id: number;
  type: string;
  data: Record<string, unknown>;
  sourceKey: string | null;
  isRead: boolean;
  createdAt: Date | null;
};

export async function listNotificationsForUser(userId: number): Promise<NotificationRow[]> {
  const rows = await db
    .select({
      id: Notification.id,
      type: Notification.type,
      data: Notification.data,
      sourceKey: Notification.source_key,
      isRead: Notification.is_read,
      createdAt: Notification.created_at,
    })
    .from(Notification)
    .where(eq(Notification.user_id, userId))
    .orderBy(desc(Notification.created_at))
    .limit(50);

  return rows.map((r) => ({
    ...r,
    isRead: r.isRead ?? false,
    data: (r.data as Record<string, unknown>) ?? {},
  }));
}

export async function markNotificationRead(notificationId: number, userId: number): Promise<void> {
  const [row] = await db
    .select({ id: Notification.id })
    .from(Notification)
    .where(and(eq(Notification.id, notificationId), eq(Notification.user_id, userId)))
    .limit(1);

  if (!row) {
    throw new HttpError({ status: 404, code: "NOT_FOUND", message: "Notification not found" });
  }

  await db
    .update(Notification)
    .set({ is_read: true })
    .where(eq(Notification.id, notificationId));
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  await db
    .update(Notification)
    .set({ is_read: true })
    .where(and(eq(Notification.user_id, userId), eq(Notification.is_read, false)));
}
