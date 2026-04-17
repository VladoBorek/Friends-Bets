import type { FriendRequestsListQuery, FriendsListQuery } from "@pb138/shared/schemas/friends";
import {
  countAcceptedFriendsForUser,
  countPendingFriendRequestsForUser,
  listAcceptedFriendshipsForUser,
  listPendingFriendRequestsForUser,
  listUsersByIds,
} from "../../repositories/friend-repository";
import { buildUserSummaryMap, mapFriendRequestSummary } from "./mappers/friend-mapper"

export async function listFriends(currentUserId: number, query: FriendsListQuery) {
  const total = await countAcceptedFriendsForUser(currentUserId);
  const rows = await listAcceptedFriendshipsForUser(currentUserId, query.limit, query.offset);

  const friendIds = rows.map((row) =>
    row.requesterId === currentUserId ? row.addresseeId : row.requesterId,
  );

  const users = await listUsersByIds([...new Set(friendIds)]);
  const usersById = buildUserSummaryMap(users);

  const data = friendIds
    .map((friendId) => usersById.get(friendId))
    .filter((friend): friend is NonNullable<typeof friend> => Boolean(friend));

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

export async function listFriendRequests(currentUserId: number, query: FriendRequestsListQuery) {
  const total = await countPendingFriendRequestsForUser(currentUserId, query.direction);
  const rows = await listPendingFriendRequestsForUser(
    currentUserId,
    query.direction,
    query.limit,
    query.offset,
  );

  const userIds = [...new Set(rows.flatMap((row) => [row.requesterId, row.addresseeId]))];
  const users = await listUsersByIds(userIds);
  const usersById = buildUserSummaryMap(users);

  const data = rows.map((row) => mapFriendRequestSummary(row, usersById));

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
