import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/db";
import { Outcome, Transaction, Wallet, Wager } from "../db/schema";

export type WalletRow = {
  id: number;
  balance: string | null;
};

export type TransactionRow = {
  id: number;
  wagerId: number | null;
  type: string;
  amount: string | null;
  wagerName: string | null;
  outcomeName: string | null;
  createdAt: Date | null;
};

export async function findWalletByUserId(userId: number): Promise<WalletRow | null> {
  const [row] = await db
    .select({
      id: Wallet.id,
      balance: Wallet.balance,
    })
    .from(Wallet)
    .where(eq(Wallet.user_id, userId))
    .limit(1);

  return row ?? null;
}

export async function listTransactionsByWalletId(walletId: number): Promise<TransactionRow[]> {
  return db
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
        eq(Transaction.wallet_id, walletId),
        inArray(Transaction.type, ["bet", "payout", "deposit", "withdraw"]),
      ),
    )
    .orderBy(desc(Transaction.created_at));
}

export async function listTransactionsByWalletIdPaginated(
  walletId: number,
  limit: number,
  offset: number,
  type?: string,
  searchPattern?: string,
): Promise<TransactionRow[]> {
  const whereConditions = [
    eq(Transaction.wallet_id, walletId),
    inArray(Transaction.type, ["bet", "payout", "deposit", "withdraw"]),
  ];

  if (type && type !== "ALL") {
    whereConditions.push(eq(Transaction.type, type));
  }

  if (searchPattern) {
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

  return db
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
}

export async function countTransactionsByWalletId(
  walletId: number,
  type?: string,
  searchPattern?: string,
): Promise<number> {
  const whereConditions = [
    eq(Transaction.wallet_id, walletId),
    inArray(Transaction.type, ["bet", "payout", "deposit", "withdraw"]),
  ];

  if (type && type !== "ALL") {
    whereConditions.push(eq(Transaction.type, type));
  }

  if (searchPattern) {
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

  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(Transaction)
    .leftJoin(Outcome, eq(Transaction.outcome_id, Outcome.id))
    .leftJoin(Wager, eq(Outcome.wager_id, Wager.id))
    .where(and(...whereConditions));

  return Number(result?.count ?? 0);
}
