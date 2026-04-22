import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/db";
import { Bet, Outcome, Transaction, Wallet, Wager } from "../db/schema";

export type FriendStatsAggregateRow = {
  friendId: number;
  totalWagers: number;
  wins: number;
  losses: number;
  draws: number;
  netPnl: string;
};

export type SharedFriendWagerRow = {
  friendId: number;
  wagerId: number;
  wagerTitle: string;
  wagerCreatedAt: Date | null;
  currentUserOutcomeTitle: string | null;
  friendOutcomeTitle: string | null;
  currentUserBetAmount: string;
  friendBetAmount: string;
  currentUserNetPnl: string;
  friendNetPnl: string;
  currentUserDidWin: boolean;
  friendDidWin: boolean;
};

type ParticipantWagerRow = {
  wagerId: number;
  wagerTitle: string;
  wagerCreatedAt: Date | null;
  userId: number;
  outcomeTitle: string;
  betAmount: string;
  payoutAmount: string | null;
  didWin: boolean | null;
};

type FriendStatsAccumulator = {
  friendId: number;
  totalWagers: number;
  wins: number;
  losses: number;
  draws: number;
  netPnl: number;
};

function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  return 0;
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function compareSharedWagersDesc(a: SharedFriendWagerRow, b: SharedFriendWagerRow): number {
  const aTime = a.wagerCreatedAt?.getTime() ?? 0;
  const bTime = b.wagerCreatedAt?.getTime() ?? 0;

  if (aTime !== bTime) {
    return bTime - aTime;
  }

  return b.wagerId - a.wagerId;
}

async function listClosedParticipantWagerRows(userIds: number[]): Promise<ParticipantWagerRow[]> {
  if (userIds.length === 0) {
    return [];
  }

  return db
    .select({
      wagerId: Wager.id,
      wagerTitle: Wager.title,
      wagerCreatedAt: Wager.created_at,
      userId: Bet.user_id,
      outcomeTitle: Outcome.title,
      betAmount: Bet.amount,
      payoutAmount: Transaction.amount,
      didWin: Outcome.is_winner,
    })
    .from(Bet)
    .innerJoin(Outcome, eq(Bet.outcome_id, Outcome.id))
    .innerJoin(Wager, eq(Outcome.wager_id, Wager.id))
    .leftJoin(Wallet, eq(Wallet.user_id, Bet.user_id))
    .leftJoin(
      Transaction,
      and(
        eq(Transaction.wallet_id, Wallet.id),
        eq(Transaction.outcome_id, Bet.outcome_id),
        eq(Transaction.type, "payout"),
      ),
    )
    .where(and(eq(Wager.status, "CLOSED"), inArray(Bet.user_id, userIds)))
    .orderBy(desc(Wager.created_at), desc(Wager.id), desc(Bet.id));
}

function buildSharedWagerRows(
  currentUserId: number,
  participantRows: ParticipantWagerRow[],
): SharedFriendWagerRow[] {
  const participantsByWager = new Map<number, Map<number, ParticipantWagerRow>>();

  for (const row of participantRows) {
    let wagerParticipants = participantsByWager.get(row.wagerId);

    if (!wagerParticipants) {
      wagerParticipants = new Map<number, ParticipantWagerRow>();
      participantsByWager.set(row.wagerId, wagerParticipants);
    }

    if (!wagerParticipants.has(row.userId)) {
      wagerParticipants.set(row.userId, row);
    }
  }

  const sharedRows: SharedFriendWagerRow[] = [];

  for (const wagerParticipants of participantsByWager.values()) {
    const currentUserRow = wagerParticipants.get(currentUserId);

    if (!currentUserRow) {
      continue;
    }

    for (const [friendId, friendRow] of wagerParticipants.entries()) {
      if (friendId === currentUserId) {
        continue;
      }

      sharedRows.push({
        friendId,
        wagerId: currentUserRow.wagerId,
        wagerTitle: currentUserRow.wagerTitle,
        wagerCreatedAt: currentUserRow.wagerCreatedAt,
        currentUserOutcomeTitle: currentUserRow.outcomeTitle,
        friendOutcomeTitle: friendRow.outcomeTitle,
        currentUserBetAmount: formatMoney(parseMoney(currentUserRow.betAmount)),
        friendBetAmount: formatMoney(parseMoney(friendRow.betAmount)),
        currentUserNetPnl: formatMoney(
          parseMoney(currentUserRow.payoutAmount) - parseMoney(currentUserRow.betAmount),
        ),
        friendNetPnl: formatMoney(
          parseMoney(friendRow.payoutAmount) - parseMoney(friendRow.betAmount),
        ),
        currentUserDidWin: Boolean(currentUserRow.didWin),
        friendDidWin: Boolean(friendRow.didWin),
      });
    }
  }

  return sharedRows.sort(compareSharedWagersDesc);
}

async function listSharedWagerRows(
  currentUserId: number,
  friendIds: number[],
): Promise<SharedFriendWagerRow[]> {
  if (friendIds.length === 0) {
    return [];
  }

  const uniqueUserIds = [...new Set([currentUserId, ...friendIds])];
  const friendIdSet = new Set(friendIds);
  const participantRows = await listClosedParticipantWagerRows(uniqueUserIds);

  return buildSharedWagerRows(currentUserId, participantRows).filter((row) =>
    friendIdSet.has(row.friendId),
  );
}

export async function listFriendStatsPreviewRows(
  currentUserId: number,
  friendIds: number[],
): Promise<FriendStatsAggregateRow[]> {
  const sharedRows = await listSharedWagerRows(currentUserId, friendIds);
  const statsByFriendId = new Map<number, FriendStatsAccumulator>();

  for (const row of sharedRows) {
    const existing = statsByFriendId.get(row.friendId) ?? {
      friendId: row.friendId,
      totalWagers: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      netPnl: 0,
    };

    existing.totalWagers += 1;
    existing.netPnl += parseMoney(row.currentUserNetPnl);

    if (row.currentUserDidWin && !row.friendDidWin) {
      existing.wins += 1;
    } else if (!row.currentUserDidWin && row.friendDidWin) {
      existing.losses += 1;
    } else {
      existing.draws += 1;
    }

    statsByFriendId.set(row.friendId, existing);
  }

  return Array.from(statsByFriendId.values()).map((row) => ({
    friendId: row.friendId,
    totalWagers: row.totalWagers,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    netPnl: formatMoney(row.netPnl),
  }));
}

export async function countSharedWagers(currentUserId: number, friendId: number): Promise<number> {
  const sharedRows = await listSharedWagerRows(currentUserId, [friendId]);
  return sharedRows.length;
}

export async function listRecentSharedWagers(
  currentUserId: number,
  friendId: number,
  limit: number,
): Promise<SharedFriendWagerRow[]> {
  const sharedRows = await listSharedWagerRows(currentUserId, [friendId]);
  return sharedRows.slice(0, limit);
}

export async function listSharedWagersPage(
  currentUserId: number,
  friendId: number,
  limit: number,
  offset: number,
): Promise<SharedFriendWagerRow[]> {
  const sharedRows = await listSharedWagerRows(currentUserId, [friendId]);
  return sharedRows.slice(offset, offset + limit);
}
