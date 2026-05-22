import { db } from "../../../db/db";
import { Notification } from "../../../db/schema";
import type { NotificationChannel, CreateNotificationInput } from "./types";

export const inAppChannel: NotificationChannel = {
  async deliver(input: CreateNotificationInput): Promise<void> {
    await db
      .insert(Notification)
      .values({
        user_id: input.userId,
        type: input.type,
        data: input.data,
        source_key: input.sourceKey,
      })
      .onConflictDoNothing({ target: Notification.source_key });
  },
};
