import type { WalletHistoryItem } from "../../../../../shared/src/schemas/wallet"

export const WALLET_TRANSACTION_PAGE_SIZE = 10;

export type WalletTransactionTypeFilter = "ALL" | WalletHistoryItem["type"];

export const WALLET_TRANSACTION_TYPE_FILTERS: Array<{ value: WalletTransactionTypeFilter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "bet", label: "Bets" },
  { value: "payout", label: "Payouts" },
  { value: "deposit", label: "Deposits" },
  { value: "withdraw", label: "Withdrawals" },
];

export function filterWalletTransactions(
  transactions: WalletHistoryItem[],
  search: string,
  typeFilter: WalletTransactionTypeFilter,
): WalletHistoryItem[] {
  const normalizedSearch = search.trim().toLowerCase();

  return transactions.filter((transaction) => {
    if (typeFilter !== "ALL" && transaction.type !== typeFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return (
      transaction.wagerName.toLowerCase().includes(normalizedSearch) ||
      transaction.outcome.toLowerCase().includes(normalizedSearch)
    );
  });
}