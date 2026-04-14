import { z } from "zod";

export const walletHistoryItemSchema = z.object({
  id: z.number().int(),
  wagerId: z.number().int(),
  wagerName: z.string(),
  type: z.enum(["bet", "payout"]),
  outcome: z.string(),
  walletImpact: z.string(),
  timestamp: z.string(),
});

export const walletOverviewSchema = z.object({
  balance: z.string(),
  history: z.array(walletHistoryItemSchema),
});

export const getWalletResponseSchema = z.object({
  data: walletOverviewSchema,
});

export type WalletHistoryItem = z.infer<typeof walletHistoryItemSchema>;
export type WalletOverview = z.infer<typeof walletOverviewSchema>;
