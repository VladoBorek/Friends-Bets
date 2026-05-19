import { db } from "../../db/db";
import { HttpError } from "../../errors";
import { Wallet, Transaction, User } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { CreateWagerRequest, ResolveWagerRequest, WagerDetail } from "@pb138/shared/schemas/wager";
import {
  findWagerByIdWithDetails,
  createWager as repoCreateWager,
  updateWagerFields,
  deleteWagerById,
  updateWagerStatus,
  listWagerOutcomes,
  updateOutcomeWinner,
} from "../../repositories/wagers/wager-repository";
import { findCategoryById } from "../../repositories/wagers/category-repository";
import { createOutcomes, deleteOutcomesByWager } from "../../repositories/wagers/outcome-repository";
import { createWagerVisibilities, deleteWagerVisibilities } from "../../repositories/wagers/wager-visibility-repository";
import { listWinningBets, wagerHasBets } from "../../repositories/wagers/bet-repository";
import { mapWagerDetail } from "./mappers/wager-mapper";
import { ensureUserIsVerified, ensureUserIsNotSuspended } from "./wager-validation";
import { calculatePayout, formatMoney, parseMoney } from "./wager-utils";

export async function createWager(
  input: CreateWagerRequest,
  createdById: number,
): Promise<WagerDetail> {
  const [category, creator] = await Promise.all([
    findCategoryById(input.categoryId),
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

  if (!category) {
    throw new HttpError(400, "Unknown categoryId");
  }

  if (!creator[0]) {
    throw new HttpError(400, "Unknown creator");
  }

  ensureUserIsVerified(creator[0]);
  ensureUserIsNotSuspended({ suspendedUntil: creator[0].suspendedUntil?.toISOString() ?? null });

  const wagerId = await db.transaction(async () => {
    const newWagerId = await repoCreateWager({
      title: input.title,
      description: input.description ?? null,
      categoryId: input.categoryId,
      createdById,
      isPublic: input.isPublic,
    });

    await createOutcomes(
      newWagerId,
      input.outcomes.map((o) => ({ title: o.title })),
    );

    if (!input.isPublic && input.invitedUserIds && input.invitedUserIds.length > 0) {
      await createWagerVisibilities(newWagerId, input.invitedUserIds);
    }

    return newWagerId;
  });

  const wagerRow = await findWagerByIdWithDetails(wagerId, createdById);
  if (!wagerRow) {
    throw new HttpError(500, "Failed to load created wager");
  }

  const outcomes = await listWagerOutcomes(wagerId);
  return mapWagerDetail(wagerRow, outcomes);
}

export async function updateWager(
  wagerId: number,
  input: CreateWagerRequest,
  requestingUserId: number,
): Promise<WagerDetail> {
  const wagerRow = await findWagerByIdWithDetails(wagerId, requestingUserId);
  if (!wagerRow) throw new HttpError(404, "Wager not found");
  if (wagerRow.createdById !== requestingUserId) throw new HttpError(403, "Only the wager creator can edit this wager");
  if (wagerRow.status !== "OPEN") throw new HttpError(400, "Only OPEN wagers can be edited");

  if (await wagerHasBets(wagerId)) throw new HttpError(400, "Cannot edit a wager that has bets");

  const category = await findCategoryById(input.categoryId);
  if (!category) throw new HttpError(400, "Unknown categoryId");

  await db.transaction(async () => {
    await updateWagerFields(wagerId, {
      title: input.title,
      description: input.description ?? null,
      categoryId: input.categoryId,
      isPublic: input.isPublic,
    });
    await deleteOutcomesByWager(wagerId);
    await createOutcomes(wagerId, input.outcomes.map((o) => ({ title: o.title })));
    await deleteWagerVisibilities(wagerId);
    if (!input.isPublic && input.invitedUserIds && input.invitedUserIds.length > 0) {
      await createWagerVisibilities(wagerId, input.invitedUserIds);
    }
  });

  const updated = await findWagerByIdWithDetails(wagerId, requestingUserId);
  if (!updated) throw new HttpError(500, "Failed to load updated wager");
  const outcomes = await listWagerOutcomes(wagerId);
  return mapWagerDetail(updated, outcomes);
}

export async function deleteWager(wagerId: number, requestingUserId: number): Promise<void> {
  const wagerRow = await findWagerByIdWithDetails(wagerId, requestingUserId);
  if (!wagerRow) throw new HttpError(404, "Wager not found");
  if (wagerRow.createdById !== requestingUserId) throw new HttpError(403, "Only the wager creator can delete this wager");

  if (await wagerHasBets(wagerId)) throw new HttpError(400, "Cannot delete a wager that has bets");

  await deleteWagerById(wagerId);
}

export async function closeWagerBetting(
  wagerId: number,
  requestingUserId: number,
): Promise<WagerDetail> {
  const wagerRow = await findWagerByIdWithDetails(wagerId, requestingUserId);

  if (!wagerRow) {
    throw new HttpError(404, "Wager not found");
  }

  if (wagerRow.createdById !== requestingUserId) {
    throw new HttpError(403, "Only the wager creator can end betting");
  }

  if (wagerRow.status !== "OPEN") {
    throw new HttpError(400, "Only OPEN wagers can have betting ended");
  }

  await updateWagerStatus(wagerId, "PENDING");

  const updatedWagerRow = await findWagerByIdWithDetails(wagerId, requestingUserId);
  if (!updatedWagerRow) {
    throw new HttpError(500, "Failed to load updated wager");
  }

  const outcomes = await listWagerOutcomes(wagerId);
  return mapWagerDetail(updatedWagerRow, outcomes);
}

export async function resolveWager(
  wagerId: number,
  input: ResolveWagerRequest,
): Promise<WagerDetail> {
  const result = await db.transaction(async () => {
    const wagerRow = await findWagerByIdWithDetails(wagerId);

    if (!wagerRow) {
      throw new HttpError(404, "Wager not found");
    }

    if (wagerRow.status === "CLOSED") {
      throw new HttpError(400, "Wager is already closed");
    }

    const outcomes = await listWagerOutcomes(wagerId);

    const winningOutcome = outcomes.find((o) => o.id === input.outcomeId);
    if (!winningOutcome) {
      throw new HttpError(400, "Outcome not found for this wager");
    }

    const totalPool = outcomes.reduce((sum, row) => sum + parseMoney(row.totalBet), 0);
    const winningPool = parseMoney(winningOutcome.totalBet);

    const winningBets = await listWinningBets(input.outcomeId, wagerId);

    await updateWagerStatus(wagerId, "CLOSED");
    await updateOutcomeWinner(wagerId, input.outcomeId);

    if (winningBets.length > 0 && winningPool > 0 && totalPool > 0) {
      for (const betRow of winningBets) {
        const [userWallet] = await db
          .select({ id: Wallet.id, balance: Wallet.balance })
          .from(Wallet)
          .where(eq(Wallet.user_id, betRow.userId))
          .limit(1);

        if (!userWallet) {
          throw new HttpError(404, "Wallet not found");
        }

        const stake = parseMoney(betRow.amount);
        const payout = calculatePayout(totalPool, stake, winningPool);
        const nextUserBalance = formatMoney(parseMoney(userWallet.balance) + payout);

        await db.update(Wallet).set({ balance: nextUserBalance }).where(eq(Wallet.id, userWallet.id));

        await db.insert(Transaction).values({
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

  const updatedWagerRow = await findWagerByIdWithDetails(wagerId);
  if (!updatedWagerRow) {
    throw new HttpError(500, "Failed to load resolved wager");
  }

  const outcomes = await listWagerOutcomes(wagerId);
  return mapWagerDetail(updatedWagerRow, outcomes);
}
