import {
  groupActionResponseSchema,
  groupResponseSchema,
  paginatedGroupsResponseSchema,
  type CreateGroupRequest,
  type UpdateGroupRequest,
} from "@pb138/shared/schemas/groups";
import { readJsonOrThrow } from "./utils";

export async function fetchGroups(input: { page: number; limit: number; query?: string }) {
  const params = new URLSearchParams({
    limit: String(input.limit),
    offset: String((input.page - 1) * input.limit),
    q: input.query ?? "",
  });

  const response = await fetch(`/api/groups?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  return paginatedGroupsResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to load groups"),
  );
}

export async function createGroup(body: CreateGroupRequest) {
  const response = await fetch("/api/groups", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return groupResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to create group"),
  ).data;
}

export async function updateGroup(groupId: number, body: UpdateGroupRequest) {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return groupResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to update group"),
  ).data;
}

export async function deleteGroup(groupId: number) {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  return groupActionResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to delete group"),
  );
}

export async function leaveGroup(groupId: number) {
  const response = await fetch(`/api/groups/${groupId}/leave`, {
    method: "POST",
    credentials: "same-origin",
  });

  return groupActionResponseSchema.parse(
    await readJsonOrThrow(response, "Unable to leave group"),
  );
}