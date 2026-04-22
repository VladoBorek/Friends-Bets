import type { FriendRequestsListQuery, FriendsListQuery, FriendDiscoveryQuery} from "@pb138/shared/schemas/friends";
import {
  countAcceptedFriendsForUser,
  countPendingFriendRequestsForUser,
  countDiscoverableUsers,
  listAcceptedFriendshipsForUser,
  listPendingFriendRequestsForUser,
  listUsersByIds,
  listDiscoverableUsers,
  listFriendshipsBetweenUserAndCandidates
} from "../../repositories/friend-repository";
import { buildUserSummaryMap, mapFriendRequestSummary, mapRelationshipState, mapUserSummary, mapFriendSummary } from "./mappers/friend-mapper"
import { listFriendStatsPreviewRows } from "../../repositories/friend-stats-repository";


export async function listFriends(currentUserId: number, query: FriendsListQuery) {
  const total = await countAcceptedFriendsForUser(currentUserId);
  const rows = await listAcceptedFriendshipsForUser(currentUserId, query.limit, query.offset);

  const friendIds = rows.map((row) =>
    row.requesterId === currentUserId ? row.addresseeId : row.requesterId,
  );

  const uniqueFriendIds = [...new Set(friendIds)];

  const [users, statRows] = await Promise.all([
    listUsersByIds(uniqueFriendIds),
    listFriendStatsPreviewRows(currentUserId, uniqueFriendIds),
  ]);

  const usersById = buildUserSummaryMap(users);
  const statsByFriendId = new Map(statRows.map((row) => [row.friendId, row]));

  const data = friendIds
    .map((friendId) => {
      const user = usersById.get(friendId);
      if (!user) return null;
      return mapFriendSummary(user, statsByFriendId.get(friendId));
    })
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

export async function discoverUsers(currentUserId: number, query: FriendDiscoveryQuery) {
  const total = await countDiscoverableUsers(currentUserId, query.q);
  const users = await listDiscoverableUsers(currentUserId, query.q, query.limit, query.offset);

  const candidateIds = users.map((user) => user.id);
  const friendships = await listFriendshipsBetweenUserAndCandidates(currentUserId, candidateIds);

  const friendshipsByUserId = new Map<number, (typeof friendships)[number]>();

  for (const friendship of friendships) {
    const otherUserId =
      friendship.requesterId === currentUserId
        ? friendship.addresseeId
        : friendship.requesterId;

    friendshipsByUserId.set(otherUserId, friendship);
  }

  const data = users.map((user) => {
    const relationship = mapRelationshipState(
        currentUserId,
        friendshipsByUserId.get(user.id),
    );

    return {
        ...mapUserSummary(user),
        relationshipState: relationship.relationshipState,
        friendshipId: relationship.friendshipId,
    };
    });

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
