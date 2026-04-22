import type {
  DiscoveredUser,
  FriendDiscoveryState,
} from "@pb138/shared/schemas/friends";


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

export function buildButtonLabel(state: FriendDiscoveryState, isSending: boolean) {
  if (isSending) {
    return "Sending...";
  }

  if (state === "FRIENDS") {
    return "Friends";
  }

  if (state === "OUTGOING_PENDING" || state === "INCOMING_PENDING") {
    return "Request sent";
  }

  return "Add";
}


export function filterUsers(users: DiscoveredUser[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return users;
  }

  return users.filter((candidate) => {
    const haystack = `${candidate.username} ${candidate.email}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}