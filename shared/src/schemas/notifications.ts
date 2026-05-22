import { z } from "zod";

// Payload types per notification type — extend this union to add new notification types
export type WagerResolvedData = {
  wagerId: number;
  wagerTitle: string;
  outcomeTitle: string;
};

export type PayoutData = WagerResolvedData & {
  amountWon: string;
};

// Future types can be added here, e.g.:
// export type FriendRequestData = { fromUserId: number; fromUsername: string };

export type NotificationPayload =
  | { type: "payout"; data: PayoutData }
  | { type: "wager_resolved"; data: WagerResolvedData };
// | { type: "friend_request"; data: FriendRequestData }

export const notificationSchema = z.object({
  id: z.number().int(),
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
  isRead: z.boolean(),
  sourceKey: z.string().nullable(),
  createdAt: z.string(),
});

export const listNotificationsResponseSchema = z.object({
  data: z.array(notificationSchema),
});

export const markReadResponseSchema = z.object({
  data: z.object({ success: z.boolean() }),
});

export type NotificationItem = z.infer<typeof notificationSchema>;
export type ListNotificationsResponse = z.infer<typeof listNotificationsResponseSchema>;
