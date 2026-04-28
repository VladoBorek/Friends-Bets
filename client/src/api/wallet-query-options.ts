import { queryOptions } from "@tanstack/react-query";
import { WALLET_TRANSACTION_PAGE_SIZE } from "../features/wallet/wallet-transactions";
import { fetchWalletTransactions } from "./wallet-api";

export const WALLET_TRANSACTION_PAGE_SIZE_CONST = 10;

export const walletKeys = {
  all: ["wallet"] as const,
  transactions: (page: number, type?: string, search?: string) =>
    ["wallet", "transactions", page, type ?? "ALL", search ?? ""] as const,
};

export const walletQueries = {
  transactions: (page: number, type?: string, search?: string) =>
    queryOptions({
      queryKey: walletKeys.transactions(page, type, search),
      queryFn: () =>
        fetchWalletTransactions({
          page,
          limit: WALLET_TRANSACTION_PAGE_SIZE,
          type,
          search,
        }),
      staleTime: 30_000,
    }),
};
