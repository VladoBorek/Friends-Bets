import type {
  FriendRequestSummary,
  FriendStats,
  FriendSummary,
  FriendWagerSummary,
} from "@pb138/shared/schemas/friends";
import type { UserSummary } from "@pb138/shared/schemas/user";
import { HttpError } from "../../../errors";
import type { FriendUserRow, FriendshipRow } from "../../../repositories/friend-repository";
import type {
  FriendStatsAggregateRow,
  SharedFriendWagerRow,
} from "../../../repositories/friend-stats-repository";

function normalizeRoleName(roleName: unknown): string {
  if (typeof roleName !== "string" || roleName.trim().length === 0) {
    return "USER";
  }

  return roleName.toUpperCase();
}

function formatMoney(value: string | number | null | undefined): string {
  const numericValue = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : "0.00";
}

export function mapUserSummary(row: FriendUserRow): UserSummary {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    roleName: normalizeRoleName(row.roleName),
    isVerified: row.isVerified ?? false,
    suspendedUntil: row.suspendedUntil?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? null,
  };
}

export function buildUserSummaryMap(users: FriendUserRow[]): Map<number, UserSummary> {
  return new Map(users.map((user) => [user.id, mapUserSummary(user)]));
}

export function mapFriendRequestSummary(
  row: FriendshipRow,
  usersById: Map<number, UserSummary>,
): FriendRequestSummary {
  const requester = usersById.get(row.requesterId);
  const addressee = usersById.get(row.addresseeId);

  if (!requester || !addressee) {
    throw new HttpError(500, "Friend request references missing user");
  }

  return {
    id: row.id,
    status: row.status as "PENDING" | "ACCEPTED" | "REJECTED",
    createdAt: row.createdAt?.toISOString() ?? null,
    respondedAt: row.respondedAt?.toISOString() ?? null,
    requester,
    addressee,
  };
}

export function emptyFriendStats(): FriendStats {
  return {
    totalWagers: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    netPnl: "0.00",
  };
}

export function mapFriendStats(row?: FriendStatsAggregateRow): FriendStats {
  if (!row) {
    return emptyFriendStats();
  }

  const totalWagers = row.totalWagers ?? 0;
  const wins = row.wins ?? 0;

  return {
    totalWagers,
    wins,
    losses: row.losses ?? 0,
    draws: row.draws ?? 0,
    winRate: totalWagers > 0 ? Math.round((wins / totalWagers) * 100) : 0,
    netPnl: formatMoney(row.netPnl),
  };
}

export function mapFriendSummary(user: UserSummary, statsRow?: FriendStatsAggregateRow): FriendSummary {
  return {
    ...user,
    stats: mapFriendStats(statsRow),
  };
}

export function mapFriendWagerSummary(row: SharedFriendWagerRow): FriendWagerSummary {
  const headToHeadResult =
    row.currentUserDidWin === row.friendDidWin
      ? "DRAW"
      : row.currentUserDidWin
        ? "WIN"
        : "LOSS";

  return {
    wagerId: row.wagerId,
    title: row.wagerTitle,
    createdAt: row.wagerCreatedAt?.toISOString() ?? null,
    currentUserOutcomeTitle: row.currentUserOutcomeTitle,
    friendOutcomeTitle: row.friendOutcomeTitle,
    currentUserBetAmount: formatMoney(row.currentUserBetAmount),
    friendBetAmount: formatMoney(row.friendBetAmount),
    currentUserNetPnl: formatMoney(row.currentUserNetPnl),
    friendNetPnl: formatMoney(row.friendNetPnl),
    headToHeadResult,
  };
}

export function mapRelationshipState(
  currentUserId: number,
  friendship:
    | {
        requesterId: number;
        addresseeId: number;
        status: string;
        id: number;
      }
    | undefined,
) {
  if (!friendship) {
    return {
      relationshipState: "AVAILABLE" as const,
      friendshipId: null,
    };
  }

  if (friendship.status === "ACCEPTED") {
    return {
      relationshipState: "FRIENDS" as const,
      friendshipId: friendship.id,
    };
  }

  if (friendship.status === "PENDING") {
    return {
      relationshipState:
        friendship.requesterId === currentUserId
          ? ("OUTGOING_PENDING" as const)
          : ("INCOMING_PENDING" as const),
      friendshipId: friendship.id,
    };
  }

  return {
    relationshipState: "AVAILABLE" as const,
    friendshipId: null,
  };
}
