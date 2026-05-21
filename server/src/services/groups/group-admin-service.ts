import { HttpError } from "../../errors";
import * as groupMemberRepository from "../../repositories/group/group-member-repository";
import * as groupRepository from "../../repositories/group/group-repository";
import { mapGroupMemberSummary, mapGroupSummary } from "./mappers/group-mapper";

export async function listAllGroups(query: string, limit: number, offset: number) {
  const [total, rows] = await Promise.all([
    groupRepository.countAllGroups(query),
    groupRepository.listAllGroups(query, limit, offset),
  ]);

  const data = rows.map(mapGroupSummary);

  return {
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    },
  };
}

export async function deleteGroupAdmin(groupId: number): Promise<void> {
  const group = await groupRepository.findGroupById(groupId);
  if (!group) {
    throw new HttpError({
      status: 404,
      code: "GROUP_NOT_FOUND",
      message: "Group not found",
    });
  }

  const activeWagerCount = await groupRepository.countActiveWagersForGroup(groupId);
  if (activeWagerCount > 0) {
    throw new HttpError({
      status: 409,
      code: "CONFLICT",
      message: "Cannot delete group with active wagers",
    });
  }

  await groupRepository.deleteGroup(groupId);
}

export async function listGroupMembersAdmin(
  groupId: number,
  query: string,
  limit: number,
  offset: number,
) {
  const group = await groupRepository.findGroupById(groupId);
  if (!group) {
    throw new HttpError({
      status: 404,
      code: "GROUP_NOT_FOUND",
      message: "Group not found",
    });
  }

  const [total, rows] = await Promise.all([
    groupMemberRepository.countGroupMembers(groupId, query),
    groupMemberRepository.listGroupMembers(groupId, query, limit, offset),
  ]);

  const data = rows.map(mapGroupMemberSummary);

  return {
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    },
  };
}

export async function removeGroupMemberAdmin(
  groupId: number,
  userId: number,
  newOwnerId?: number,
): Promise<void> {
  const group = await groupRepository.findGroupById(groupId);
  if (!group) {
    throw new HttpError({
      status: 404,
      code: "GROUP_NOT_FOUND",
      message: "Group not found",
    });
  }

  const membership = await groupMemberRepository.findMembership(groupId, userId);
  if (!membership) {
    throw new HttpError({
      status: 404,
      code: "GROUP_NOT_FOUND",
      message: "Group member not found",
    });
  }

  if (membership.role === "OWNER") {
    if (newOwnerId === userId) {
      throw new HttpError({
        status: 400,
        code: "BAD_REQUEST",
        message: "New owner must be different",
      });
    }

    if (newOwnerId) {
      const newOwnerMembership = await groupMemberRepository.findMembership(groupId, newOwnerId);
      if (!newOwnerMembership) {
        throw new HttpError({
          status: 400,
          code: "BAD_REQUEST",
          message: "New owner must be a group member",
        });
      }

      await groupMemberRepository.updateGroupMemberRole(groupId, newOwnerId, "OWNER");
    } else {
      const otherOwners = await groupMemberRepository.countOtherGroupOwners(groupId, userId);
      if (otherOwners === 0) {
        throw new HttpError({
          status: 400,
          code: "BAD_REQUEST",
          message: "New owner must be selected",
        });
      }
    }
  }

  await groupMemberRepository.removeGroupMember(groupId, userId);
}

export async function changeGroupOwnerAdmin(groupId: number, newOwnerId: number): Promise<void> {
  const group = await groupRepository.findGroupById(groupId);
  if (!group) {
    throw new HttpError({
      status: 404,
      code: "GROUP_NOT_FOUND",
      message: "Group not found",
    });
  }

  const membership = await groupMemberRepository.findMembership(groupId, newOwnerId);
  if (!membership) {
    throw new HttpError({
      status: 400,
      code: "BAD_REQUEST",
      message: "New owner must be a group member",
    });
  }

  await groupMemberRepository.setGroupOwner(groupId, newOwnerId);
}
