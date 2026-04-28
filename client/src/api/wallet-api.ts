import {
  paginatedWalletTransactionsResponseSchema,
  walletTransactionsQuerySchema,
} from "@pb138/shared/schemas/wallet";
import type { WalletTransactionsQuery } from "@pb138/shared/schemas/wallet";

export async function fetchWalletTransactions(input: {
  page: number;
  limit: number;
  type?: WalletTransactionsQuery["type"];
  search?: string;
}) {
  const query = walletTransactionsQuerySchema.parse({
    limit: input.limit,
    offset: (input.page - 1) * input.limit,
    type: input.type ?? "ALL",
    search: input.search ?? "",
  });

  const params = new URLSearchParams({
    limit: String(query.limit),
    offset: String(query.offset),
    type: query.type,
    search: query.search,
  });

  const response = await fetch(`/api/wallet/transactions?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json && typeof json === "object" && "message" in json
        ? String((json as { message: unknown }).message)
        : "Unable to load wallet transactions";

    throw new Error(message);
  }

  return paginatedWalletTransactionsResponseSchema.parse(json);
}
