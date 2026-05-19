import { db } from "../../db/db";
import { HttpError } from "../../errors";
import { Wallet, Transaction, User } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { Bet as BetType, PlaceBetRequest } from "@pb138/shared/schemas/wager";
import {
  findBetByUserAndWager,
  createBet as repoCreateBet,
  listBetsByWager,
} from "../../repositories/wagers/bet-repository";
import { findWagerByIdWithDetails } from "../../repositories/wagers/wager-repository";
import { findOutcomeByIdAndWager } from "../../repositories/wagers/outcome-repository";
import { mapBet, mapWagerBetSummary, type WagerBet } from "./mappers/bet-mapper";
import { ensureUserIsVerified, ensureUserIsNotSuspended } from "./wager-validation";
import { formatMoney, parseMoney } from "./wager-utils";
import { getWagerById } from "./wager-query-service";

export async function placeBet(
  wagerId: number,
  input: PlaceBetRequest,
  userId: number,
): Promise<BetType> {
  const wagerRow = await findWagerByIdWithDetails(wagerId);

  if (!wagerRow) {
    throw new HttpError(404, "Wager not found");
  }

  if (wagerRow.status !== "OPEN") {
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

  const outcome = await findOutcomeByIdAndWager(input.outcomeId, wagerId);
  if (!outcome) {
    throw new HttpError(400, "Outcome not found for this wager");
  }

  const existingBet = await findBetByUserAndWager(userId, wagerId);
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

    const formattedAmount = formatMoney(input.amount);

    const betRow = await repoCreateBet({
      userId,
      outcomeId: input.outcomeId,
      amount: formattedAmount,
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

  return mapBet(created);
}

export async function listBets(wagerId: number, requestingUserId?: number): Promise<WagerBet[]> {
  await getWagerById(wagerId, requestingUserId);

  const rows = await listBetsByWager(wagerId);
  return rows.map(mapWagerBetSummary);
}
