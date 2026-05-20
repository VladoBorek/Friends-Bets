import {
  friendStatsResponseSchema,
  paginatedFriendWagersResponseSchema,
} from "@pb138/shared/schemas/friends";
import { readJsonOrThrow } from "../http";

export async function fetchFriendStats(friendId: number) {
  const response = await fetch(`/api/friends/${friendId}/stats`, {
    method: "GET",
    credentials: "same-origin",
  });

  return friendStatsResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load friend statistics"),
  );
}

export async function fetchFriendWagersPage(input: {
  friendId: number;
  page: number;
  limit: number;
}) {
  const params = new URLSearchParams({
    limit: String(input.limit),
    offset: String((input.page - 1) * input.limit),
  });

  const response = await fetch(`/api/friends/${input.friendId}/wagers?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  return paginatedFriendWagersResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load shared wagers"),
  );
}