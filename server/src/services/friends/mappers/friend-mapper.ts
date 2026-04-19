import type { FriendRequestSummary, FriendSummary } from "@pb138/shared/schemas/friends";
import { HttpError } from "../../../errors";
import type { FriendUserRow, FriendshipRow } from "../../../repositories/friend-repository";

function normalizeRoleName(roleName: unknown): string {
  if (typeof roleName !== "string" || roleName.trim().length === 0) {
    return "USER";
  }

  return roleName.toUpperCase();
}

export function mapUserSummary(row: FriendUserRow): FriendSummary {
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

export function buildUserSummaryMap(users: FriendUserRow[]): Map<number, FriendSummary> {
  return new Map(users.map((user) => [user.id, mapUserSummary(user)]));
}

export function mapFriendRequestSummary(
  row: FriendshipRow,
  usersById: Map<number, FriendSummary>,
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