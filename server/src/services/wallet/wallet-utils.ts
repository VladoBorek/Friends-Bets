import type { WalletHistoryItem } from "@pb138/shared/schemas/wallet";
import { HttpError } from "../../errors";

export function formatMoney(value: number): string {
  return value.toFixed(2);
}

export function normalizePositiveAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, "BAD_REQUEST", "Amount must be a positive number");
  }

  return Number(amount.toFixed(2));
}

export function mapTransactionToHistoryItem(row: {
  id: number;
  wagerId: number | null;
  type: string;
  amount: string | null;
  wagerName: string | null;
  outcomeName: string | null;
  createdAt: Date | null;
}): WalletHistoryItem {
  const signedAmount = Number(row.amount ?? "0");
  const normalizedType =
    row.type === "payout" || row.type === "deposit" || row.type === "withdraw" ? row.type : "bet";
  const isWagerTransaction = normalizedType === "bet" || normalizedType === "payout";

  return {
    id: row.id,
    wagerId: isWagerTransaction ? row.wagerId : null,
    wagerName:
      row.wagerName ??
      (normalizedType === "deposit" ? "Wallet deposit" : normalizedType === "withdraw" ? "Wallet withdrawal" : "Wager"),
    type: normalizedType,
    outcome:
      row.outcomeName ??
      (normalizedType === "deposit" ? "Funds added" : normalizedType === "withdraw" ? "Funds removed" : "N/A"),
    walletImpact: signedAmount >= 0 ? `+${signedAmount.toFixed(2)}` : signedAmount.toFixed(2),
    timestamp: (row.createdAt ?? new Date()).toISOString(),
  };
}