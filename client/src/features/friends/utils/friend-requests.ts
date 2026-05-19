import type { FriendRequestSummary } from "@pb138/shared/schemas/friends";

export type PendingFriendRequestTab = "incoming" | "outgoing";

export function getRequestPerson(request: FriendRequestSummary, type: PendingFriendRequestTab) {
  return type === "incoming" ? request.requester : request.addressee;
}