import { asc, desc, eq, sql, and } from "drizzle-orm";
import { db } from "../db/db";
import { Bet, Category, Outcome, Transaction, User, Wallet, Wager } from "../db/schema";
import { HttpError } from "../errors";
import type {
  Bet as BetType,
  CategorySummary,
  CreateWagerRequest,
  PlaceBetRequest,
  ResolveWagerRequest,
  WagerDetail,
  WagerSummary,
} from "../../../shared/src/schemas/wager";

function normalizeStatus(value: string | null): "OPEN" | "PENDING" | "CLOSED" {
  if (value === "OPEN" || value === "PENDING" || value === "CLOSED") {
    return value;
  }

  return "OPEN";
}

function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return Number(value);
  }

  return 0;
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function calculateOdds(totalPool: number, totalBet: number): string | null {
  if (totalPool <= 0 || totalBet <= 0) {
    return null;
  }

  return (totalPool / totalBet).toFixed(2);
}

type WagerBaseRow = {
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
  currentUserBetAmount: string | null;
  currentUserBetOutcomeTitle: string | null;
};

type WagerOutcomeRow = {
  id: number;
  title: string;
  isWinner: boolean | null;
  totalBet: string | null;
};

function mapWagerSummary(row: WagerBaseRow, outcomes: WagerOutcomeRow[]): WagerSummary {
  const currentUserBetAmount = parseMoney(row.currentUserBetAmount);
  const normalizedOutcomes = outcomes.map((outcome) => ({
    id: outcome.id,
    title: outcome.title,
    odds: calculateOdds(
      outcomes.reduce((sum, current) => sum + parseMoney(current.totalBet), 0),
      parseMoney(outcome.totalBet),
    ),
    totalBet: formatMoney(parseMoney(outcome.totalBet)),
    isWinner: outcome.isWinner ?? false,
  }));
  const totalPool = normalizedOutcomes.reduce((sum, outcome) => sum + parseMoney(outcome.totalBet), 0);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: normalizeStatus(row.status),
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    createdById: row.createdById,
    creatorName: row.creatorName,
    isPublic: row.isPublic ?? false,
    createdAt: row.createdAt?.toISOString() ?? null,
    totalPool: formatMoney(totalPool),
    currentUserBetAmount: currentUserBetAmount > 0 ? formatMoney(currentUserBetAmount) : null,
    currentUserBetOutcomeTitle: currentUserBetAmount > 0 ? row.currentUserBetOutcomeTitle : null,
    outcomes: normalizedOutcomes,
  };
}

function mapWagerDetail(row: WagerBaseRow, outcomes: WagerOutcomeRow[]): WagerDetail {
  const totalPool = outcomes.reduce((sum, outcome) => sum + parseMoney(outcome.totalBet), 0);

  return {
    ...mapWagerSummary(row, outcomes),
    outcomes: outcomes.map((outcome) => ({
      id: outcome.id,
      title: outcome.title,
      odds: calculateOdds(totalPool, parseMoney(outcome.totalBet)),
      totalBet: formatMoney(parseMoney(outcome.totalBet)),
      isWinner: outcome.isWinner ?? false,
    })),
  };
}

async function loadWagerBase(wagerId: number, currentUserId?: number): Promise<WagerBaseRow> {
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
      currentUserBetAmount,
      currentUserBetOutcomeTitle,
    })
    .from(Wager)
    .innerJoin(Category, eq(Wager.category_id, Category.id))
    .innerJoin(User, eq(Wager.created_by_id, User.id))
    .where(eq(Wager.id, wagerId))
    .limit(1);

  if (!row) {
    throw new HttpError(404, "Wager not found");
  }

  return row;
}

async function loadWagerOutcomes(wagerId: number): Promise<WagerOutcomeRow[]> {
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

async function loadWagerDetail(wagerId: number, currentUserId?: number): Promise<WagerDetail> {
  const [row, outcomes] = await Promise.all([loadWagerBase(wagerId, currentUserId), loadWagerOutcomes(wagerId)]);
  return mapWagerDetail(row, outcomes);
}

function ensureUserIsNotSuspended(user: { suspendedUntil?: string | null }): void {
  if (!user.suspendedUntil) {
    return;
  }

  const suspensionEndsAt = new Date(user.suspendedUntil);
  if (Number.isNaN(suspensionEndsAt.getTime())) {
    return;
  }

  if (suspensionEndsAt.getTime() > Date.now()) {
    throw new HttpError(403, "Suspended users cannot perform this action");
  }
}

function ensureUserIsVerified(user: { isVerified?: boolean | null }): void {
  if (user.isVerified === false) {
    throw new HttpError(403, "Account must be verified to perform this action.");
  }
}

export async function listWagers(currentUserId?: number): Promise<WagerSummary[]> {
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

  const rows = await db
    .select({
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
      currentUserBetAmount,
      currentUserBetOutcomeTitle,
    })
    .from(Wager)
    .innerJoin(Category, eq(Wager.category_id, Category.id))
    .innerJoin(User, eq(Wager.created_by_id, User.id))
    .orderBy(desc(Wager.created_at));

  return Promise.all(rows.map(async (row) => mapWagerSummary(row, await loadWagerOutcomes(row.id))));
}

export async function getWagerById(id: number, currentUserId?: number): Promise<WagerDetail> {
  return loadWagerDetail(id, currentUserId);
}

export async function listCategories(): Promise<CategorySummary[]> {
  return db
    .select({
      id: Category.id,
      name: Category.name,
    })
    .from(Category)
    .orderBy(asc(Category.name));
}

export async function createWager(input: CreateWagerRequest, createdById: number): Promise<WagerDetail> {
  const [category, creator] = await Promise.all([
    db.select({ id: Category.id }).from(Category).where(eq(Category.id, input.categoryId)).limit(1),
    db
      .select({
        id: User.id,
        isVerified: User.is_verified,
        suspendedUntil: User.suspended_until,
      })
      .from(User)
      .where(eq(User.id, createdById))
      .limit(1),
  ]);

  if (!category[0]) {
    throw new HttpError(400, "Unknown categoryId");
  }

  if (!creator[0]) {
    throw new HttpError(400, "Unknown creator");
  }

  ensureUserIsVerified(creator[0]);
  ensureUserIsNotSuspended({ suspendedUntil: creator[0].suspendedUntil?.toISOString() ?? null });

  const created = await db.transaction(async (tx) => {
    const [newWager] = await tx
      .insert(Wager)
      .values({
        title: input.title,
        description: input.description ?? null,
        status: "OPEN",
        category_id: input.categoryId,
        created_by_id: createdById,
        is_public: input.isPublic,
      })
      .returning({ id: Wager.id });

    await tx.insert(Outcome).values(
      input.outcomes.map((outcome) => ({
        wager_id: newWager.id,
        title: outcome.title,
      })),
    );

    return newWager;
  });

  return loadWagerDetail(created.id, createdById);
}

export async function placeBet(wagerId: number, input: PlaceBetRequest, userId: number): Promise<BetType> {
  const [wager] = await db.select().from(Wager).where(eq(Wager.id, wagerId)).limit(1);
  if (!wager) {
    throw new HttpError(404, "Wager not found");
  }

  if (wager.status !== "OPEN") {
    throw new HttpError(400, "Cannot place bets on wagers that are not OPEN");
  }

  const [bettingUser] = await db
    .select({
      id: User.id,
      isVerified: User.is_verified,
      suspendedUntil: User.suspended_until,
    })
    .from(User)
    .where(eq(User.id, userId))
    .limit(1);

  if (!bettingUser) {
    throw new HttpError(404, "User not found");
  }

  ensureUserIsVerified(bettingUser);
  ensureUserIsNotSuspended({ suspendedUntil: bettingUser.suspendedUntil?.toISOString() ?? null });

  const [outcome] = await db
    .select({ id: Outcome.id, wagerId: Outcome.wager_id })
    .from(Outcome)
    .where(and(eq(Outcome.id, input.outcomeId), eq(Outcome.wager_id, wagerId)))
    .limit(1);

  if (!outcome) {
    throw new HttpError(400, "Outcome not found for this wager");
  }

  const [existingBet] = await db
    .select({ id: Bet.id })
    .from(Bet)
    .innerJoin(Outcome, eq(Bet.outcome_id, Outcome.id))
    .where(and(eq(Bet.user_id, userId), eq(Outcome.wager_id, wagerId)))
    .limit(1);

  if (existingBet) {
    throw new HttpError(409, "You have already placed a bet on this wager");
  }

  const created = await db.transaction(async (tx) => {
    const [currentUserWallet] = await tx
      .select({ id: Wallet.id, balance: Wallet.balance })
      .from(Wallet)
      .where(eq(Wallet.user_id, userId))
      .limit(1);

    if (!currentUserWallet) {
      throw new HttpError(404, "Wallet not found");
    }

    if (parseMoney(currentUserWallet.balance) < input.amount) {
      throw new HttpError(400, "Insufficient balance to place this bet.");
    }

    const [betRow] = await tx
      .insert(Bet)
      .values({
        user_id: userId,
        outcome_id: input.outcomeId,
        amount: formatMoney(input.amount),
      })
      .returning({
        id: Bet.id,
        userId: Bet.user_id,
        outcomeId: Bet.outcome_id,
        amount: Bet.amount,
        createdAt: Bet.created_at,
      });

    const nextUserBalance = formatMoney(parseMoney(currentUserWallet.balance) - input.amount);

    await tx.update(Wallet).set({ balance: nextUserBalance }).where(eq(Wallet.id, currentUserWallet.id));

    await tx.insert(Transaction).values({
      wallet_id: currentUserWallet.id,
      outcome_id: input.outcomeId,
      type: "bet",
      amount: formatMoney(-input.amount),
    });

    return betRow;
  });

  if (!created) {
    throw new HttpError(500, "Failed to create bet");
  }

  return {
    id: created.id,
    userId: created.userId,
    outcomeId: created.outcomeId,
    amount: parseMoney(created.amount),
    createdAt: (created.createdAt ?? new Date()).toISOString(),
  };
}

export async function resolveWager(wagerId: number, input: ResolveWagerRequest): Promise<WagerDetail> {
  const result = await db.transaction(async (tx) => {
    const [wager] = await tx.select().from(Wager).where(eq(Wager.id, wagerId)).limit(1);
    if (!wager) {
      throw new HttpError(404, "Wager not found");
    }

    if (wager.status === "CLOSED") {
      throw new HttpError(400, "Wager is already closed");
    }

    const [winningOutcome] = await tx
      .select({ id: Outcome.id, wagerId: Outcome.wager_id })
      .from(Outcome)
      .where(and(eq(Outcome.id, input.outcomeId), eq(Outcome.wager_id, wagerId)))
      .limit(1);

    if (!winningOutcome) {
      throw new HttpError(400, "Outcome not found for this wager");
    }

    const outcomes = await tx
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

    const totalPool = outcomes.reduce((sum, row) => sum + parseMoney(row.totalBet), 0);
    const winningOutcomeTotal = outcomes.find((outcome) => outcome.id === input.outcomeId);
    const winningPool = parseMoney(winningOutcomeTotal?.totalBet ?? 0);

    const winningBets = await tx
      .select({
        id: Bet.id,
        userId: Bet.user_id,
        amount: Bet.amount,
      })
      .from(Bet)
      .innerJoin(Outcome, eq(Bet.outcome_id, Outcome.id))
      .where(and(eq(Outcome.wager_id, wagerId), eq(Bet.outcome_id, input.outcomeId)));

    await tx.update(Wager).set({ status: "CLOSED" }).where(eq(Wager.id, wagerId));
    await tx.update(Outcome).set({ is_winner: false }).where(eq(Outcome.wager_id, wagerId));
    await tx.update(Outcome).set({ is_winner: true }).where(eq(Outcome.id, input.outcomeId));

    if (winningBets.length > 0 && winningPool > 0 && totalPool > 0) {
      for (const betRow of winningBets) {
        const [userWallet] = await tx
          .select({ id: Wallet.id, balance: Wallet.balance })
          .from(Wallet)
          .where(eq(Wallet.user_id, betRow.userId))
          .limit(1);

        if (!userWallet) {
          throw new HttpError(404, "Wallet not found");
        }

        const stake = parseMoney(betRow.amount);
        const payout = Number(((totalPool * stake) / winningPool).toFixed(2));
        const nextUserBalance = formatMoney(parseMoney(userWallet.balance) + payout);

        await tx.update(Wallet).set({ balance: nextUserBalance }).where(eq(Wallet.id, userWallet.id));

        await tx.insert(Transaction).values({
          wallet_id: userWallet.id,
          outcome_id: input.outcomeId,
          type: "payout",
          amount: formatMoney(payout),
        });
      }
    }

    return { wagerId };
  });

  if (!result) {
    throw new HttpError(500, "Failed to resolve wager");
  }

  return loadWagerDetail(wagerId);
}

export { ensureUserIsNotSuspended };
export { ensureUserIsVerified };
