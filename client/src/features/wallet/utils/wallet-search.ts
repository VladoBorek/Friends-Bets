import { z } from "zod";

export const WALLET_TRANSACTION_PAGE_SIZE = 10;

export const walletSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  type: z.string().default("ALL"),
  search: z.string().default(""),
});

export type WalletSearch = z.infer<typeof walletSearchSchema>;
