import { paginatedFriendsResponseSchema } from "@pb138/shared/schemas/friends";
import { readJsonOrThrow } from "../http";

export async function fetchFriends(input: { page: number; limit: number }) {
  const params = new URLSearchParams({
    limit: String(input.limit),
    offset: String((input.page - 1) * input.limit),
  });

  const response = await fetch(`/api/friends?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  return paginatedFriendsResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load friends"),
  );
}