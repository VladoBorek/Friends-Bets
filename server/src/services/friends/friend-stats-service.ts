import type { FriendWagersListQuery } from "@pb138/shared/schemas/friends";
import { HttpError } from "../../errors";
import { findFriendshipBetweenUsers, listUsersByIds } from "../../repositories/friend-repository";
import {
  countSharedWagers,
  listFriendStatsPreviewRows,
  listRecentSharedWagers,
  listSharedWagersPage,
} from "../../repositories/friend-stats-repository";
import { mapFriendSummary, mapFriendWagerSummary, mapUserSummary } from "./mappers/friend-mapper";

const RECENT_WAGERS_LIMIT = 3;

async function getAcceptedFriendOrThrow(currentUserId: number, friendId: number) {
  const friendship = await findFriendshipBetweenUsers(currentUserId, friendId);

  if (!friendship || friendship.status !== "ACCEPTED") {
    throw new HttpError(404, "Friend not found");
  }

  const [friendRow] = await listUsersByIds([friendId]);
  if (!friendRow) {
    throw new HttpError(404, "Friend not found");
  }

  return mapUserSummary(friendRow);
}

export async function getFriendStats(currentUserId: number, friendId: number) {
  const friendUser = await getAcceptedFriendOrThrow(currentUserId, friendId);

  const [statsRows, recentRows] = await Promise.all([
    listFriendStatsPreviewRows(currentUserId, [friendId]),
    listRecentSharedWagers(currentUserId, friendId, RECENT_WAGERS_LIMIT),
  ]);

  return {
    friend: mapFriendSummary(friendUser, statsRows[0]),
    recentWagers: recentRows.map(mapFriendWagerSummary),
  };
}

export async function listFriendWagers(
  currentUserId: number,
  friendId: number,
  query: FriendWagersListQuery,
) {
  const friendUser = await getAcceptedFriendOrThrow(currentUserId, friendId);

  const [statsRows, total, rows] = await Promise.all([
    listFriendStatsPreviewRows(currentUserId, [friendId]),
    countSharedWagers(currentUserId, friendId),
    listSharedWagersPage(currentUserId, friendId, query.limit, query.offset),
  ]);

  return {
    friend: mapFriendSummary(friendUser, statsRows[0]),
    data: rows.map(mapFriendWagerSummary),
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + rows.length < total,
    },
  };
}
