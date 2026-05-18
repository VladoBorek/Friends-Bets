import type { UserSummary } from "@pb138/shared/schemas/user";
import { HttpError } from "../../errors";
import * as groupMemberRepository from "../../repositories/group/group-member-repository";

export async function requireGroupMember(groupId: number, userId: number) {
  const membership = await groupMemberRepository.findMembership(groupId, userId);

  if (!membership) {
    throw new HttpError(404, "Group not found");
  }

  return membership;
}

export async function requireGroupOwner(groupId: number, userId: number) {
  const membership = await requireGroupMember(groupId, userId);

  if (membership.role !== "OWNER") {
    throw new HttpError(403, "Only group owners can perform this action");
  }

  return membership;
}

export async function requireGroupOwnerOrAdmin(
  groupId: number,
  user: Pick<UserSummary, "id" | "roleName">,
) {
  const membership = await requireGroupMember(groupId, user.id);

  if (membership.role !== "OWNER" && user.roleName !== "ADMIN") {
    throw new HttpError(403, "Only group owners or admins can perform this action");
  }

  return membership;
}
