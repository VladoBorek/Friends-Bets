import type {
  Bet as BetType,
  PlaceBetRequest,
  WagerBetsListQuery,
} from "@pb138/shared/schemas/wager";
import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import { Transaction, User, Wallet } from "../../db/schema";
import { HttpError } from "../../errors";
import {
  countBetsByWager,
  createBet as repoCreateBet,
  findBetByUserAndWager,
  listBetsByWagerPaginated,
} from "../../repositories/wagers/bet-repository";
import { findOutcomeByIdAndWager } from "../../repositories/wagers/outcome-repository";
import { findWagerByIdWithDetails } from "../../repositories/wagers/wager-repository";
import { mapBet, mapWagerBetSummary } from "./mappers/bet-mapper";
import { getWagerById } from "./wager-query-service";
import { ensureUserIsNotSuspended, ensureUserIsVerified } from "./wager-validation";
import { formatMoney, parseMoney } from "./wager-utils";

export async function placeBet(
  wagerId: number,
  input: PlaceBetRequest,
  userId: number,
): Promise<BetType> {
  const wagerRow = await findWagerByIdWithDetails(wagerId);

  if (!wagerRow) {
    throw new HttpError({
      status: 404,
      code: "WAGER_NOT_FOUND",
      message: "Wager not found",
    });
  }

  if (wagerRow.status !== "OPEN") {
    throw new HttpError({
      status: 400,
      code: "WAGER_NOT_OPEN",
      message: "Cannot place bets on wagers that are not open",
    });
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
    throw new HttpError({
      status: 404,
      code: "USER_NOT_FOUND",
      message: "User not found",
    });
  }

  ensureUserIsVerified(bettingUser);
  ensureUserIsNotSuspended({ suspendedUntil: bettingUser.suspendedUntil?.toISOString() ?? null });

  const outcome = await findOutcomeByIdAndWager(input.outcomeId, wagerId);

  if (!outcome) {
    throw new HttpError({
      status: 400,
      code: "OUTCOME_NOT_FOUND",
      message: "Outcome not found for this wager",
    });
  }

  const existingBet = await findBetByUserAndWager(userId, wagerId);

  if (existingBet) {
    throw new HttpError({
      status: 409,
      code: "BET_ALREADY_EXISTS",
      message: "You have already placed a bet on this wager",
    });
  }

  const created = await db.transaction(async (tx) => {
    const [currentUserWallet] = await tx
      .select({ id: Wallet.id, balance: Wallet.balance })
      .from(Wallet)
      .where(eq(Wallet.user_id, userId))
      .limit(1);

    if (!currentUserWallet) {
      throw new HttpError({
        status: 404,
        code: "WALLET_NOT_FOUND",
        message: "Wallet not found",
      });
    }

    if (parseMoney(currentUserWallet.balance) < input.amount) {
      throw new HttpError({
        status: 400,
        code: "WALLET_INSUFFICIENT_BALANCE",
        message: "Insufficient balance to place this bet",
      });
    }

    const formattedAmount = formatMoney(input.amount);

    const betRow = await repoCreateBet({
      userId,
      outcomeId: input.outcomeId,
      amount: formattedAmount,
    });

    const nextUserBalance = formatMoney(parseMoney(currentUserWallet.balance) - input.amount);

    await tx
      .update(Wallet)
      .set({ balance: nextUserBalance })
      .where(eq(Wallet.id, currentUserWallet.id));

    await tx.insert(Transaction).values({
      wallet_id: currentUserWallet.id,
      outcome_id: input.outcomeId,
      type: "bet",
      amount: formatMoney(-input.amount),
    });

    return betRow;
  });

  if (!created) {
    throw new HttpError({
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create bet",
    });
  }

  return mapBet(created);
}

export async function listBets(
  wagerId: number,
  requestingUserId: number | undefined,
  query: WagerBetsListQuery,
) {
  await getWagerById(wagerId, requestingUserId);

  const [total, rows] = await Promise.all([
    countBetsByWager(wagerId),
    listBetsByWagerPaginated(wagerId, query.limit, query.offset),
  ]);

  const data = rows.map(mapWagerBetSummary);

  return {
    data,
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + data.length < total,
    },
  };
}