export type CreateNotificationInput = {
  userId: number;
  type: string;
  data: Record<string, unknown>;
  sourceKey: string;
};

export interface NotificationChannel {
  deliver(input: CreateNotificationInput): Promise<void>;
}
