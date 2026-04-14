import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/db";
import { Outcome, Transaction, Wallet, Wager } from "../db/schema";
import { HttpError } from "../errors";
import type { WalletOverview } from "../../../shared/src/schemas/wallet";

export async function getWalletOverview(userId: number): Promise<WalletOverview> {
  const [wallet] = await db
    .select({
      id: Wallet.id,
      balance: Wallet.balance,
    })
    .from(Wallet)
    .where(eq(Wallet.user_id, userId))
    .limit(1);

  if (!wallet) {
    throw new HttpError(404, "Wallet not found");
  }

  const rows = await db
    .select({
      id: Transaction.id,
      wagerId: Transaction.wager_id,
      type: Transaction.type,
      amount: Transaction.amount,
      wagerName: Wager.title,
      outcomeName: Outcome.title,
      createdAt: Transaction.created_at,
    })
    .from(Transaction)
    .innerJoin(Wager, eq(Transaction.wager_id, Wager.id))
    .innerJoin(Outcome, eq(Transaction.outcome_id, Outcome.id))
    .where(
      and(
        eq(Transaction.wallet_id, wallet.id),
        inArray(Transaction.type, ["bet", "payout"]),
      ),
    )
    .orderBy(desc(Transaction.created_at));

  return {
    balance: wallet.balance ?? "0",
    history: rows.flatMap((row) => {
      if (!row.wagerId) {
        return [];
      }

      const signedAmount = Number(row.amount ?? "0");

      return [{
        id: row.id,
        wagerId: row.wagerId,
        wagerName: row.wagerName,
        type: row.type === "payout" ? "payout" : "bet",
        outcome: row.outcomeName,
        walletImpact: signedAmount >= 0 ? `+${signedAmount.toFixed(2)}` : signedAmount.toFixed(2),
        timestamp: (row.createdAt ?? new Date()).toISOString(),
      }];
    }),
  };
}
