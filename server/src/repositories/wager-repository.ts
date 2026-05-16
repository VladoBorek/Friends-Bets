import { desc, eq, or, sql } from "drizzle-orm";
import { db } from "../db/db";
import { Bet, Category, Outcome, User, Wager } from "../db/schema";

export type WagerRow = {
  id: number;
  title: string;
  description: string | null;
  status: string | null;
  categoryId: number;
  categoryName: string;
  createdById: number;
  creatorName: string;
  isPublic: boolean | null;
  createdAt: Date | null;
};

export type WagerBaseRow = WagerRow & {
  currentUserBetAmount: string | null;
  currentUserBetOutcomeTitle: string | null;
};

export type WagerOutcomeRow = {
  id: number;
  title: string;
  isWinner: boolean | null;
  totalBet: string | null;
};

const wagerSelect = {
  id: Wager.id,
  title: Wager.title,
  description: Wager.description,
  status: Wager.status,
  categoryId: Category.id,
  categoryName: Category.name,
  createdById: User.id,
  creatorName: User.username,
  isPublic: Wager.is_public,
  createdAt: Wager.created_at,
};

export async function findWagerById(wagerId: number): Promise<WagerRow | null> {
  const [row] = await db
    .select(wagerSelect)
    .from(Wager)
    .innerJoin(Category, eq(Wager.category_id, Category.id))
    .innerJoin(User, eq(Wager.created_by_id, User.id))
    .where(eq(Wager.id, wagerId))
    .limit(1);

  return row ?? null;
}

export async function findWagerByIdWithDetails(
  wagerId: number,
  currentUserId?: number,
): Promise<WagerBaseRow | null> {
  const currentUserBetAmount = currentUserId
    ? sql<string | null>`(
      SELECT COALESCE(SUM(${Bet.amount}), '0')
      FROM ${Bet}
      INNER JOIN ${Outcome} ON ${Outcome.id} = ${Bet.outcome_id}
      WHERE ${Outcome.wager_id} = ${Wager.id} AND ${Bet.user_id} = ${currentUserId}
    )`
    : sql<string | null>`NULL`;

  const currentUserBetOutcomeTitle = currentUserId
    ? sql<string | null>`(
      SELECT ${Outcome.title}
      FROM ${Bet}
      INNER JOIN ${Outcome} ON ${Outcome.id} = ${Bet.outcome_id}
      WHERE ${Outcome.wager_id} = ${Wager.id} AND ${Bet.user_id} = ${currentUserId}
      LIMIT 1
    )`
    : sql<string | null>`NULL`;

  const [row] = await db
    .select({
      ...wagerSelect,
      currentUserBetAmount,
      currentUserBetOutcomeTitle,
    })
    .from(Wager)
    .innerJoin(Category, eq(Wager.category_id, Category.id))
    .innerJoin(User, eq(Wager.created_by_id, User.id))
    .where(eq(Wager.id, wagerId))
    .limit(1);

  return row ?? null;
}

export async function listWagersWithDetails(
  currentUserId?: number,
): Promise<WagerBaseRow[]> {
  const currentUserBetAmount = currentUserId
    ? sql<string | null>`(
      SELECT COALESCE(SUM(${Bet.amount}), '0')
      FROM ${Bet}
      INNER JOIN ${Outcome} ON ${Outcome.id} = ${Bet.outcome_id}
      WHERE ${Outcome.wager_id} = ${Wager.id} AND ${Bet.user_id} = ${currentUserId}
    )`
    : sql<string | null>`NULL`;

  const currentUserBetOutcomeTitle = currentUserId
    ? sql<string | null>`(
      SELECT ${Outcome.title}
      FROM ${Bet}
      INNER JOIN ${Outcome} ON ${Outcome.id} = ${Bet.outcome_id}
      WHERE ${Outcome.wager_id} = ${Wager.id} AND ${Bet.user_id} = ${currentUserId}
      LIMIT 1
    )`
    : sql<string | null>`NULL`;

  const visibilityFilter = currentUserId
    ? or(
        eq(Wager.is_public, true),
        eq(Wager.created_by_id, currentUserId),
        sql`EXISTS (SELECT 1 FROM wager_visibility WHERE wager_visibility.wager_id = ${Wager.id} AND wager_visibility.user_id = ${currentUserId})`,
      )
    : eq(Wager.is_public, true);

  return db
    .select({
      ...wagerSelect,
      currentUserBetAmount,
      currentUserBetOutcomeTitle,
    })
    .from(Wager)
    .innerJoin(Category, eq(Wager.category_id, Category.id))
    .innerJoin(User, eq(Wager.created_by_id, User.id))
    .where(visibilityFilter)
    .orderBy(desc(Wager.created_at));
}

export async function listWagerOutcomes(wagerId: number): Promise<WagerOutcomeRow[]> {
  return db
    .select({
      id: Outcome.id,
      title: Outcome.title,
      isWinner: Outcome.is_winner,
      totalBet: sql<string | null>`COALESCE(SUM(${Bet.amount}), '0')`,
    })
    .from(Outcome)
    .leftJoin(Bet, eq(Bet.outcome_id, Outcome.id))
    .where(eq(Outcome.wager_id, wagerId))
    .groupBy(Outcome.id, Outcome.title, Outcome.is_winner)
    .orderBy(Outcome.id);
}

export async function createWager(input: {
  title: string;
  description: string | null;
  categoryId: number;
  createdById: number;
  isPublic: boolean;
}): Promise<number> {
  const [wager] = await db
    .insert(Wager)
    .values({
      title: input.title,
      description: input.description,
      status: "OPEN",
      category_id: input.categoryId,
      created_by_id: input.createdById,
      is_public: input.isPublic,
    })
    .returning({ id: Wager.id });

  return wager.id;
}

export async function updateWagerStatus(
  wagerId: number,
  status: "OPEN" | "PENDING" | "CLOSED",
): Promise<void> {
  await db.update(Wager).set({ status }).where(eq(Wager.id, wagerId));
}

export async function updateOutcomeWinner(
  wagerId: number,
  winningOutcomeId: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(Outcome).set({ is_winner: false }).where(eq(Outcome.wager_id, wagerId));
    await tx.update(Outcome).set({ is_winner: true }).where(eq(Outcome.id, winningOutcomeId));
  });
}
