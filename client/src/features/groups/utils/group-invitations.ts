import type { GroupInvitationSummary } from "@pb138/shared/schemas/groups";

export type PendingGroupInviteTab = "incoming" | "outgoing";

export function getInvitationPerson(invite: GroupInvitationSummary, type: PendingGroupInviteTab) {
  return type === "incoming" ? invite.requester : invite.addressee;
}