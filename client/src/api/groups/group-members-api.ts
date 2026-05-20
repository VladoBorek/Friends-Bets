import {
  groupMemberResponseSchema,
  paginatedGroupMembersResponseSchema,
  type AddGroupMemberRequest,
} from "@pb138/shared/schemas/groups";
import { readJsonOrThrow } from "./utils";

export async function fetchGroupMembers(input: {
  groupId: number;
  page: number;
  limit: number;
  query?: string;
}) {
  const params = new URLSearchParams({
    limit: String(input.limit),
    offset: String((input.page - 1) * input.limit),
    q: input.query ?? "",
  });

  const response = await fetch(`/api/groups/${input.groupId}/members?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  return paginatedGroupMembersResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load group members"),
  );
}

export async function addGroupMember(groupId: number, body: AddGroupMemberRequest) {
  const response = await fetch(`/api/groups/${groupId}/members`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return groupMemberResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to add group member"),
  ).data;
}

export async function removeGroupMember(groupId: number, userId: number) {
  const response = await fetch(`/api/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  await readJsonOrThrow(response, "Unable to remove group member");
}

export async function fetchAllGroupMembers(groupId: number) {
  const members = [];
  let page = 1;

  while (true) {
    const result = await fetchGroupMembers({
      groupId,
      page,
      limit: 50,
    });

    members.push(...result.data);

    if (!result.pagination.hasMore) {
      break;
    }

    page += 1;
  }

  return members;
}