import {
  groupInvitationResponseSchema,
  paginatedGroupInvitationsResponseSchema,
  type GroupInvitationDirection,
} from "@pb138/shared/schemas/groups";
import { readJsonOrThrow } from "./utils";

const PAGE_LIMIT = 50;

async function fetchGroupInvitationsPage(direction: GroupInvitationDirection, offset: number) {
  const params = new URLSearchParams({
    direction,
    limit: String(PAGE_LIMIT),
    offset: String(offset),
  });

  const response = await fetch(`/api/groups/invitations?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  return paginatedGroupInvitationsResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load group invitations"),
  );
}

export async function fetchAllGroupInvitations(direction: GroupInvitationDirection) {
  const invites = [];
  let offset = 0;

  while (true) {
    const page = await fetchGroupInvitationsPage(direction, offset);
    invites.push(...page.data);
    if (!page.pagination.hasMore) break;
    offset += page.pagination.limit;
  }

  return invites;
}

export async function fetchGroupInvitationCount(direction: GroupInvitationDirection) {
  const page = await fetchGroupInvitationsPage(direction, 0);
  return page.pagination.total;
}

export async function sendGroupInvitation(groupId: number, addresseeId: number) {
  const response = await fetch(`/api/groups/${groupId}/invitations`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresseeId }),
  });

  return groupInvitationResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to send group invitation"),
  ).data;
}

export async function acceptGroupInvitation(invitationId: number) {
  const response = await fetch(`/api/groups/invitations/${invitationId}/accept`, {
    method: "POST",
    credentials: "same-origin",
  });

  return groupInvitationResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to accept group invitation"),
  ).data;
}

export async function rejectGroupInvitation(invitationId: number) {
  const response = await fetch(`/api/groups/invitations/${invitationId}/reject`, {
    method: "POST",
    credentials: "same-origin",
  });

  return groupInvitationResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to reject group invitation"),
  ).data;
}