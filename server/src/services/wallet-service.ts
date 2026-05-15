import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/db";
import { Outcome, Transaction, Wallet, Wager } from "../db/schema";
import { HttpError } from "../errors";
import type { WalletHistoryItem, WalletOverview, WalletTransactionsQuery } from "../../../shared/src/schemas/wallet";

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function normalizePositiveAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, "Amount must be a positive number");
  }

  return Number(amount.toFixed(2));
}

function mapTransactionToHistoryItem(row: {
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
      wagerId: Outcome.wager_id,
      type: Transaction.type,
      amount: Transaction.amount,
      wagerName: Wager.title,
      outcomeName: Outcome.title,
      createdAt: Transaction.created_at,
    })
    .from(Transaction)
    .leftJoin(Outcome, eq(Transaction.outcome_id, Outcome.id))
    .leftJoin(Wager, eq(Outcome.wager_id, Wager.id))
    .where(
      and(
        eq(Transaction.wallet_id, wallet.id),
        inArray(Transaction.type, ["bet", "payout", "deposit", "withdraw"]),
      ),
    )
    .orderBy(desc(Transaction.created_at));

  return {
    balance: wallet.balance ?? "0",
    history: rows.map(mapTransactionToHistoryItem),
  };
}

export async function getWalletTransactionsPaginated(
  userId: number,
  query: WalletTransactionsQuery,
): Promise<{
  data: WalletHistoryItem[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}> {
  const [wallet] = await db
    .select({
      id: Wallet.id,
    })
    .from(Wallet)
    .where(eq(Wallet.user_id, userId))
    .limit(1);

  if (!wallet) {
    throw new HttpError(404, "Wallet not found");
  }

  const limit = Math.min(query.limit, 50);
  const offset = Math.max(0, query.offset);

  // Build the where clause based on filters and search
  const whereConditions = [
    eq(Transaction.wallet_id, wallet.id),
    inArray(Transaction.type, ["bet", "payout", "deposit", "withdraw"]),
  ];

  if (query.type !== "ALL") {
    whereConditions.push(eq(Transaction.type, query.type));
  }

  if (query.search.trim()) {
    const searchPattern = `%${query.search.trim()}%`;
    const displayName = sql<string>`COALESCE(
      ${Wager.title},
      ${Outcome.title},
      CASE
        WHEN ${Transaction.type} = 'deposit' THEN 'Wallet deposit'
        WHEN ${Transaction.type} = 'withdraw' THEN 'Wallet withdrawal'
        ELSE ${Transaction.type}
      END
    )`;
    whereConditions.push(sql`${displayName} ILIKE ${searchPattern}`);
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(Transaction)
    .leftJoin(Outcome, eq(Transaction.outcome_id, Outcome.id))
    .leftJoin(Wager, eq(Outcome.wager_id, Wager.id))
    .where(and(...whereConditions));

  const total = Number(countResult[0]?.count ?? 0);

  // Get paginated data
  const rows = await db
    .select({
      id: Transaction.id,
      wagerId: Outcome.wager_id,
      type: Transaction.type,
      amount: Transaction.amount,
      wagerName: Wager.title,
      outcomeName: Outcome.title,
      createdAt: Transaction.created_at,
    })
    .from(Transaction)
    .leftJoin(Outcome, eq(Transaction.outcome_id, Outcome.id))
    .leftJoin(Wager, eq(Outcome.wager_id, Wager.id))
    .where(and(...whereConditions))
    .orderBy(desc(Transaction.created_at))
    .limit(limit)
    .offset(offset);

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

async function updateWalletBalanceAtomic(
  userId: number,
  amount: number,
  operation: "deposit" | "withdraw",
): Promise<{ balance: string; transaction: WalletHistoryItem }> {
  const normalizedAmount = normalizePositiveAmount(amount);
  const amountString = formatMoney(normalizedAmount);
  const signedAmount = operation === "withdraw" ? -normalizedAmount : normalizedAmount;

  return db.transaction(async (tx) => {
    const whereClause =
      operation === "withdraw"
        ? and(eq(Wallet.user_id, userId), sql`${Wallet.balance}::numeric >= ${amountString}::numeric`)
        : eq(Wallet.user_id, userId);

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
      const [wallet] = await tx
        .select({ id: Wallet.id })
        .from(Wallet)
        .where(eq(Wallet.user_id, userId))
        .limit(1);

      if (!wallet) {
        throw new HttpError(404, "Wallet not found");
      }

      throw new HttpError(400, "Withdraw amount exceeds available balance");
    }

    const [transactionRow] = await tx
      .insert(Transaction)
      .values({
        wallet_id: updatedWallet.id,
        outcome_id: null,
        type: operation,
        amount: formatMoney(signedAmount),
      })
      .returning({
        id: Transaction.id,
        createdAt: Transaction.created_at,
      });

    if (!transactionRow) {
      throw new HttpError(500, "Failed to log wallet transaction");
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
