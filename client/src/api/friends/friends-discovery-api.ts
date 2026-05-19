import {
  friendRequestResponseSchema,
  paginatedFriendRequestsResponseSchema,
  paginatedFriendsResponseSchema,
  paginatedDiscoveredUsersResponseSchema,
  type FriendRequestDirection,
} from "@pb138/shared/schemas/friends";
import { listUsersResponseSchema } from "@pb138/shared/schemas/user";

const PAGE_LIMIT = 50;

async function readJsonOrThrow(response: Response, fallbackMessage: string) {
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json && typeof json === "object" && "message" in json
        ? String((json as { message: unknown }).message)
        : fallbackMessage;

    throw new Error(message);
  }

  return json;
}

export async function fetchAllUsers() {
  const response = await fetch("/api/users", {
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

  const json = await readJsonOrThrow(response, "Unable to load friends");
  return paginatedFriendsResponseSchema.parse(json);
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

  const json = await readJsonOrThrow(response, "Unable to load friend requests");
  return paginatedFriendRequestsResponseSchema.parse(json);
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

  const json = await readJsonOrThrow(response, "Unable to send friend request");
  return friendRequestResponseSchema.parse(json).data;
}

export async function acceptFriendRequest(requestId: number) {
  const response = await fetch(`/api/friends/requests/${requestId}/accept`, {
    method: "POST",
    credentials: "same-origin",
  });

  const json = await readJsonOrThrow(response, "Unable to accept friend request");
  return friendRequestResponseSchema.parse(json).data;
}

export async function rejectFriendRequest(requestId: number) {
  const response = await fetch(`/api/friends/requests/${requestId}/reject`, {
    method: "POST",
    credentials: "same-origin",
  });

  const json = await readJsonOrThrow(response, "Unable to reject friend request");
  return friendRequestResponseSchema.parse(json).data;
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

  const json = await readJsonOrThrow(response, "Unable to load friend request count");
  return paginatedFriendRequestsResponseSchema.parse(json).pagination.total;
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

  const json = await readJsonOrThrow(response, "Unable to load discoverable users");
  return paginatedDiscoveredUsersResponseSchema.parse(json);
}
