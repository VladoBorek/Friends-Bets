import type { UserSummary } from "@pb138/shared/schemas/user";

export const DISCOVERY_PAGE_SIZE = 8;

export type RelationshipState = "add" | "request-sent" | "friends";

export function getRelationshipState(
  candidateId: number,
  friendIds: number[],
  pendingIds: number[],
): RelationshipState {
  if (friendIds.includes(candidateId)) {
    return "friends";
  }

  if (pendingIds.includes(candidateId)) {
    return "request-sent";
  }

  return "add";
}

export function buildButtonLabel(state: RelationshipState, isSending: boolean) {
  if (isSending) {
    return "Sending...";
  }

  if (state === "friends") {
    return "Friends";
  }

  if (state === "request-sent") {
    return "Request sent";
  }

  return "Add";
}

export function filterUsers(users: UserSummary[], query: string, currentUserId?: number) {
  const normalizedQuery = query.trim().toLowerCase();

  return users
    .filter((candidate) => candidate.id !== currentUserId)
    .filter((candidate) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${candidate.username} ${candidate.email}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .sort((left, right) => left.username.localeCompare(right.username));
}
