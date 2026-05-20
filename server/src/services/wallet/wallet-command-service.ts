import { and, eq, sql } from "drizzle-orm";
import type { WalletHistoryItem } from "@pb138/shared/schemas/wallet";
import { db } from "../../db/db";
import { Transaction, Wallet } from "../../db/schema";
import { HttpError } from "../../errors";
import { findWalletByUserId } from "../../repositories/wallet/wallet-repository";
import { formatMoney, mapTransactionToHistoryItem, normalizePositiveAmount } from "./wallet-utils";

export async function depositToWallet(
  userId: number,
  amount: number,
): Promise<{ balance: string; transaction: WalletHistoryItem }> {
  return updateWalletBalanceAtomic(userId, amount, "deposit");
}

export async function withdrawFromWallet(
  userId: number,
  amount: number,
): Promise<{ balance: string; transaction: WalletHistoryItem }> {
  return updateWalletBalanceAtomic(userId, amount, "withdraw");
}

async function updateWalletBalanceAtomic(
  userId: number,
  amount: number,
  operation: "deposit" | "withdraw",
): Promise<{ balance: string; transaction: WalletHistoryItem }> {
  const normalizedAmount = normalizePositiveAmount(amount);
  const amountString = formatMoney(normalizedAmount);
  const signedAmount = operation === "withdraw" ? -normalizedAmount : normalizedAmount;

  return db.transaction(async (tx) => {
    const wallet = await findWalletByUserId(userId);

    if (!wallet) {
      throw new HttpError(404, "NOT_FOUND", "Wallet not found");
    }

    const whereClause =
      operation === "withdraw"
        ? and(eq(Wallet.id, wallet.id), sql`${Wallet.balance}::numeric >= ${amountString}::numeric`)
        : eq(Wallet.id, wallet.id);

    const [updatedWallet] = await tx
      .update(Wallet)
      .set({
        balance:
          operation === "withdraw"
            ? sql`${Wallet.balance}::numeric - ${amountString}::numeric`
            : sql`${Wallet.balance}::numeric + ${amountString}::numeric`,
        updated_at: new Date(),
      })
      .where(whereClause)
      .returning({
        id: Wallet.id,
        balance: Wallet.balance,
      });

    if (!updatedWallet) {
      throw new HttpError(400, "BAD_REQUEST", "Withdraw amount exceeds available balance");
    }

    const [transactionRow] = await tx
      .insert(Transaction)
      .values({
        wallet_id: wallet.id,
        outcome_id: null,
        type: operation,
        amount: formatMoney(signedAmount),
      })
      .returning({
        id: Transaction.id,
        createdAt: Transaction.created_at,
      });

    if (!transactionRow) {
      throw new HttpError(500, "INTERNAL_SERVER_ERROR", "Failed to log wallet transaction");
    }

    return {
      balance: updatedWallet.balance ?? "0",
      transaction: mapTransactionToHistoryItem({
        id: transactionRow.id,
        wagerId: null,
        type: operation,
        amount: formatMoney(signedAmount),
        wagerName: null,
        outcomeName: null,
        createdAt: transactionRow.createdAt,
      }),
    };
  });
}