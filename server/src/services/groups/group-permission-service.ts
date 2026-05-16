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