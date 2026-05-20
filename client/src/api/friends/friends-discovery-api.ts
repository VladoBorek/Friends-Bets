import {
  friendRequestResponseSchema,
  paginatedDiscoveredUsersResponseSchema,
  paginatedFriendRequestsResponseSchema,
  paginatedFriendsResponseSchema,
  type FriendRequestDirection,
} from "@pb138/shared/schemas/friends";
import { listUsersResponseSchema } from "@pb138/shared/schemas/user";
import { readJsonOrThrow } from "../http";

const PAGE_LIMIT = 50;

export async function fetchAllUsers() {
  const response = await fetch("/api/users/admin/users?limit=50&offset=0", {
    method: "GET",
    credentials: "same-origin",
  });

  const json = await readJsonOrThrow(response, "Unable to load users");

  return listUsersResponseSchema.parse(json).data;
}

async function fetchFriendsPage(offset: number) {
  const params = new URLSearchParams({
    limit: String(PAGE_LIMIT),
    offset: String(offset),
  });

  const response = await fetch(`/api/friends?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  return paginatedFriendsResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load friends"),
  );
}

async function fetchFriendRequestsPage(direction: FriendRequestDirection, offset: number) {
  const params = new URLSearchParams({
    direction,
    limit: String(PAGE_LIMIT),
    offset: String(offset),
  });

  const response = await fetch(`/api/friends/requests?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  return paginatedFriendRequestsResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load friend requests"),
  );
}

export async function fetchAllFriends() {
  const friends = [];
  let offset = 0;

  while (true) {
    const page = await fetchFriendsPage(offset);
    friends.push(...page.data);

    if (!page.pagination.hasMore) {
      break;
    }

    offset += page.pagination.limit;
  }

  return friends;
}

export async function fetchAllFriendRequests(direction: FriendRequestDirection) {
  const requests = [];
  let offset = 0;

  while (true) {
    const page = await fetchFriendRequestsPage(direction, offset);
    requests.push(...page.data);

    if (!page.pagination.hasMore) {
      break;
    }

    offset += page.pagination.limit;
  }

  return requests;
}

export async function sendFriendRequest(addresseeId: number) {
  const response = await fetch("/api/friends/requests", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ addresseeId }),
  });

  return friendRequestResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to send friend request"),
  ).data;
}

export async function acceptFriendRequest(requestId: number) {
  const response = await fetch(`/api/friends/requests/${requestId}/accept`, {
    method: "POST",
    credentials: "same-origin",
  });

  return friendRequestResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to accept friend request"),
  ).data;
}

export async function rejectFriendRequest(requestId: number) {
  const response = await fetch(`/api/friends/requests/${requestId}/reject`, {
    method: "POST",
    credentials: "same-origin",
  });

  return friendRequestResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to reject friend request"),
  ).data;
}

export async function fetchFriendRequestCount(direction: FriendRequestDirection) {
  const params = new URLSearchParams({
    direction,
    limit: "1",
    offset: "0",
  });

  const response = await fetch(`/api/friends/requests?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  return paginatedFriendRequestsResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load friend request count"),
  ).pagination.total;
}

export async function fetchDiscoveredUsers(input: {
  page: number;
  limit: number;
  query: string;
}) {
  const params = new URLSearchParams({
    limit: String(input.limit),
    offset: String((input.page - 1) * input.limit),
    q: input.query,
  });

  const response = await fetch(`/api/friends/discover?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  return paginatedDiscoveredUsersResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load discoverable users"),
  );
}