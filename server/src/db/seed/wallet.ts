import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { Bet, Outcome, Transaction, Wager, Wallet } from "../schema";
import { toMoney } from "./utils";

export async function seedWallets(users: Array<{ id: number; username: string }>) {
  const userWallets = await db.insert(Wallet).values(
    users.map((user) => ({
      user_id: user.id,
      balance: faker.number.int({ min: 200, max: 2500 }).toString(),
    })),
  ).returning();

  return { userWallets };
}

export async function seedTransactions(params: {
  userWallets: Array<{ id: number; user_id: number | null }>;
}) {
  const walletByUserId = new Map(
    params.userWallets
      .filter((wallet): wallet is { id: number; user_id: number } => wallet.user_id !== null)
      .map((wallet) => [wallet.user_id, wallet.id]),
  );

  const seededBets = await db
    .select({
      id: Bet.id,
      userId: Bet.user_id,
      outcomeId: Bet.outcome_id,
      amount: Bet.amount,
      wagerId: Outcome.wager_id,
      isWinner: Outcome.is_winner,
      wagerStatus: Wager.status,
    })
    .from(Bet)
    .innerJoin(Outcome, eq(Outcome.id, Bet.outcome_id))
    .innerJoin(Wager, eq(Wager.id, Outcome.wager_id));

  const transactions: Array<{
    wallet_id: number;
    outcome_id: number;
    type: "bet" | "payout";
    amount: string;
    created_at: Date;
  }> = [];

  for (const bet of seededBets) {
    const walletId = walletByUserId.get(bet.userId);
    if (!walletId) continue;

    transactions.push({
      wallet_id: walletId,
      outcome_id: bet.outcomeId,
      type: "bet",
      amount: toMoney(-Number(bet.amount ?? "0")),
      created_at: faker.date.recent({ days: 30 }),
    });
  }

  const closedWagerIds = [...new Set(
    seededBets.filter((bet) => bet.wagerStatus === "CLOSED").map((bet) => bet.wagerId),
  )];

  for (const wagerId of closedWagerIds) {
    const wagerBets = seededBets.filter((bet) => bet.wagerId === wagerId);
    const winningBets = wagerBets.filter((bet) => bet.isWinner);

    const totalPool = wagerBets.reduce((sum, bet) => sum + Number(bet.amount ?? "0"), 0);
    const winningPool = winningBets.reduce((sum, bet) => sum + Number(bet.amount ?? "0"), 0);

    if (winningPool <= 0 || totalPool <= 0) continue;

    for (const bet of winningBets) {
      const walletId = walletByUserId.get(bet.userId);
      if (!walletId) continue;

      const stake = Number(bet.amount ?? "0");
      const payout = (totalPool * stake) / winningPool;

      transactions.push({
        wallet_id: walletId,
        outcome_id: bet.outcomeId,
        type: "payout",
        amount: toMoney(payout),
        created_at: faker.date.recent({ days: 10 }),
      });
    }
  }

  if (transactions.length > 0) {
    await db.insert(Transaction).values(transactions);
  }
}