import {
  friendStatsResponseSchema,
  paginatedFriendWagersResponseSchema,
} from "@pb138/shared/schemas/friends";

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

export async function fetchFriendStats(friendId: number) {
  const response = await fetch(`/api/friends/${friendId}/stats`, {
    method: "GET",
    credentials: "same-origin",
  });

  const json = await readJsonOrThrow(response, "Unable to load friend statistics");
  return friendStatsResponseSchema.parse(json);
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

  const json = await readJsonOrThrow(response, "Unable to load shared wagers");
  return paginatedFriendWagersResponseSchema.parse(json);
}
