import type { GroupMembersListQuery } from "@pb138/shared/schemas/groups";
import type { AddGroupMemberRequest, GroupRole } from "@pb138/shared/schemas/groups";

import * as groupMemberRepository from "../../repositories/group/group-member-repository";
import * as userRepository from "../../repositories/user-repository";

import { mapGroupMemberSummary } from "./mappers/group-mapper";
import { requireGroupMember, requireGroupOwner } from "./group-permission-service";

import { HttpError } from "../../errors";

export async function listGroupMembers(
  currentUserId: number,
  groupId: number,
  query: GroupMembersListQuery,
) {
  await requireGroupMember(groupId, currentUserId);

  const [total, rows] = await Promise.all([
    groupMemberRepository.countGroupMembers(groupId, query.q),
    groupMemberRepository.listGroupMembers(groupId, query.q, query.limit, query.offset),
  ]);

  const data = rows.map(mapGroupMemberSummary);

  return {
    data,
    pagination: {
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + data.length < total,
    },
  };
}

async function ensureCanRemoveMember(groupId: number, userId: number): Promise<void> {
  const membership = await groupMemberRepository.findMembership(groupId, userId);

  if (!membership) {
    throw new HttpError(404, "Group member not found");
  }

  if (membership.role !== "OWNER") {
    return;
  }

  const otherOwners = await groupMemberRepository.countOtherGroupOwners(groupId, userId);

  if (otherOwners === 0) {
    throw new HttpError(400, "Cannot remove the last group owner");
  }
}

export async function addGroupMember(
  currentUserId: number,
  groupId: number,
  input: AddGroupMemberRequest,
) {
  await requireGroupOwner(groupId, currentUserId);

  const user = await userRepository.findUserById(input.userId);

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const existingMembership = await groupMemberRepository.findMembership(groupId, input.userId);

  if (existingMembership) {
    throw new HttpError(400, "User is already a member of this group");
  }

  await groupMemberRepository.addGroupMember(groupId, input.userId, input.role);

  const rows = await groupMemberRepository.listGroupMembers(groupId, "", 50, 0);
  const createdMember = rows.find((row) => row.id === input.userId);

  if (!createdMember) {
    throw new HttpError(500, "Created group member could not be loaded");
  }

  return mapGroupMemberSummary(createdMember);
}

export async function updateGroupMemberRole(
  currentUserId: number,
  groupId: number,
  userId: number,
  role: GroupRole,
) {
  await requireGroupOwner(groupId, currentUserId);

  const membership = await groupMemberRepository.findMembership(groupId, userId);

  if (!membership) {
    throw new HttpError(404, "Group member not found");
  }

  if (membership.role === "OWNER" && role === "MEMBER") {
    const otherOwners = await groupMemberRepository.countOtherGroupOwners(groupId, userId);

    if (otherOwners === 0) {
      throw new HttpError(400, "Cannot demote the last group owner");
    }
  }

  await groupMemberRepository.updateGroupMemberRole(groupId, userId, role);

  const rows = await groupMemberRepository.listGroupMembers(groupId, "", 50, 0);
  const updatedMember = rows.find((row) => row.id === userId);

  if (!updatedMember) {
    throw new HttpError(500, "Updated group member could not be loaded");
  }

  return mapGroupMemberSummary(updatedMember);
}

export async function removeGroupMember(
  currentUserId: number,
  groupId: number,
  userId: number,
): Promise<void> {
  await requireGroupOwner(groupId, currentUserId);
  await ensureCanRemoveMember(groupId, userId);
  await groupMemberRepository.removeGroupMember(groupId, userId);
}

export async function leaveGroup(currentUserId: number, groupId: number): Promise<void> {
  await requireGroupMember(groupId, currentUserId);
  await ensureCanRemoveMember(groupId, currentUserId);
  await groupMemberRepository.removeGroupMember(groupId, currentUserId);
}