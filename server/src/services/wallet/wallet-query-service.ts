import type { WalletHistoryItem, WalletOverview, WalletTransactionsQuery } from "@pb138/shared/schemas/wallet";
import { HttpError } from "../../errors";
import {
  countTransactionsByWalletId,
  findWalletByUserId,
  listTransactionsByWalletId,
  listTransactionsByWalletIdPaginated,
} from "../../repositories/wallet/wallet-repository";
import { mapTransactionToHistoryItem } from "./wallet-utils";

export async function getWalletOverview(userId: number): Promise<WalletOverview> {
  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    throw new HttpError({
      status: 404,
      code: "WALLET_NOT_FOUND",
      message: "Wallet not found",
    });
  }

  const transactions = await listTransactionsByWalletId(wallet.id);

  return {
    balance: wallet.balance ?? "0",
    history: transactions.map(mapTransactionToHistoryItem),
  };
}

export async function getWalletTransactionsPaginated(
  userId: number,
  query: WalletTransactionsQuery,
): Promise<{
  data: WalletHistoryItem[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}> {
  const wallet = await findWalletByUserId(userId);

  if (!wallet) {
    throw new HttpError({
      status: 404,
      code: "WALLET_NOT_FOUND",
      message: "Wallet not found",
    });
  }

  const limit = Math.min(query.limit, 50);
  const offset = Math.max(0, query.offset);
  const transactionType = query.type !== "ALL" ? query.type : undefined;
  const searchPattern = query.search.trim() ? `%${query.search.trim()}%` : undefined;

  const [rows, total] = await Promise.all([
    listTransactionsByWalletIdPaginated(
      wallet.id,
      limit,
      offset,
      transactionType,
      searchPattern,
    ),
    countTransactionsByWalletId(wallet.id, transactionType, searchPattern),
  ]);

  return {
    data: rows.map(mapTransactionToHistoryItem),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}