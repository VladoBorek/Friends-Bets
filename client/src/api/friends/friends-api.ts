// client/src/features/friends/api/friends-api.ts
import { paginatedFriendsResponseSchema } from "@pb138/shared/schemas/friends";

export async function fetchFriends(input: { page: number; limit: number }) {
  const params = new URLSearchParams({
    limit: String(input.limit),
    offset: String((input.page - 1) * input.limit),
  });

  const response = await fetch(`/api/friends?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      json && typeof json === "object" && "message" in json
        ? String((json as { message: unknown }).message)
        : "Unable to load friends";

    throw new Error(message);
  }

  return paginatedFriendsResponseSchema.parse(json);
}
