import { z } from "zod";
import { paginationMetaSchema, paginationQuerySchema } from "./api";
import { betAmountSchema } from "./wager";

export const walletHistoryItemSchema = z.object({
  id: z.number().int(),
  wagerId: z.number().int().nullable(),
  wagerName: z.string(),
  type: z.enum(["bet", "payout", "deposit", "withdraw"]),
  outcome: z.string(),
  walletImpact: z.string(),
  timestamp: z.string(),
});

export const walletTransactionsQuerySchema = paginationQuerySchema.extend({
  type: z.enum(["ALL", "bet", "payout", "deposit", "withdraw"]).default("ALL"),
  search: z.string().trim().max(200).default(""),
});

export const paginatedWalletTransactionsResponseSchema = z.object({
  data: z.array(walletHistoryItemSchema),
  pagination: paginationMetaSchema,
});

export const walletOverviewSchema = z.object({
  balance: z.string(),
  history: z.array(walletHistoryItemSchema),
});

export const getWalletResponseSchema = z.object({
  data: walletOverviewSchema,
});

export const MAX_WALLET_OPERATION_AMOUNT = 10_000;
export const WALLET_AMOUNT_ERROR_MESSAGE =
  `Amount must be between 0.01 and ${MAX_WALLET_OPERATION_AMOUNT.toFixed(2)}.`;

export const walletOperationAmountSchema = betAmountSchema.refine(
  (value) => value <= MAX_WALLET_OPERATION_AMOUNT,
  { message: WALLET_AMOUNT_ERROR_MESSAGE },
);

export const walletBalanceMutationRequestSchema = z.object({
  amount: walletOperationAmountSchema,
});

export const walletBalanceMutationResponseSchema = z.object({
  data: z.object({
    balance: z.string(),
    transaction: walletHistoryItemSchema,
  }),
});

export type WalletHistoryItem = z.infer<typeof walletHistoryItemSchema>;
export type WalletOverview = z.infer<typeof walletOverviewSchema>;
export type WalletBalanceMutationRequest = z.infer<typeof walletBalanceMutationRequestSchema>;
export type WalletTransactionsQuery = z.infer<typeof walletTransactionsQuerySchema>;
export type PaginatedWalletTransactionsResponse = z.infer<typeof paginatedWalletTransactionsResponseSchema>;