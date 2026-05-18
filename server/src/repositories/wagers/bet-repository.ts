import { desc, eq, and } from "drizzle-orm";
import { db } from "../../db/db";
import { Bet, Outcome, User } from "../../db/schema";

export type BetRow = {
  id: number;
  userId: number;
  outcomeId: number;
  amount: string;
  createdAt: Date | null;
};

export type BetDetailRow = {
  id: number;
  userId: number;
  username: string;
  outcomeTitle: string;
  amount: string;
};

export type WinningBetRow = {
  id: number;
  userId: number;
  amount: string;
};

const betSelect = {
  id: Bet.id,
  userId: Bet.user_id,
  outcomeId: Bet.outcome_id,
  amount: Bet.amount,
  createdAt: Bet.created_at,
};

export async function findBetByUserAndWager(
  userId: number,
  wagerId: number,
): Promise<BetRow | null> {
  const [row] = await db
    .select(betSelect)
    .from(Bet)
    .innerJoin(Outcome, eq(Bet.outcome_id, Outcome.id))
    .where(and(eq(Bet.user_id, userId), eq(Outcome.wager_id, wagerId)))
    .limit(1);

  return row ?? null;
}

export async function createBet(input: {
  userId: number;
  outcomeId: number;
  amount: string;
}): Promise<BetRow> {
  const [row] = await db
    .insert(Bet)
    .values({
      user_id: input.userId,
      outcome_id: input.outcomeId,
      amount: input.amount,
    })
    .returning(betSelect);

  return row;
}

export async function listBetsByWager(wagerId: number): Promise<BetDetailRow[]> {
  return db
    .select({
      id: Bet.id,
      userId: User.id,
      username: User.username,
      outcomeTitle: Outcome.title,
      amount: Bet.amount,
    })
    .from(Bet)
    .innerJoin(Outcome, eq(Bet.outcome_id, Outcome.id))
    .innerJoin(User, eq(Bet.user_id, User.id))
    .where(eq(Outcome.wager_id, wagerId))
    .orderBy(desc(Bet.amount));
}

export async function wagerHasBets(wagerId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: Bet.id })
    .from(Bet)
    .innerJoin(Outcome, eq(Bet.outcome_id, Outcome.id))
    .where(eq(Outcome.wager_id, wagerId))
    .limit(1);
  return row !== undefined;
}

export async function listWinningBets(
  outcomeId: number,
  wagerId: number,
): Promise<WinningBetRow[]> {
  return db
    .select({
      id: Bet.id,
      userId: Bet.user_id,
      amount: Bet.amount,
    })
    .from(Bet)
    .innerJoin(Outcome, eq(Bet.outcome_id, Outcome.id))
    .where(and(eq(Outcome.wager_id, wagerId), eq(Bet.outcome_id, outcomeId)));
}
