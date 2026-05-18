import { z } from "zod";
import { userSummarySchema } from "./user";

export const groupRoleSchema = z.enum(["OWNER", "MEMBER"]);

const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

const paginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});


export const updateGroupMemberRoleRequestSchema = z.object({
  role: groupRoleSchema,
});

export const groupsListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).default(""),
});

export const groupMembersListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).default(""),
});

export const createGroupRequestSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).nullable().optional(),
  memberIds: z.array(z.coerce.number().int().positive()).max(50).default([]),
});

export const updateGroupRequestSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
}).refine((value) => value.name !== undefined || value.description !== undefined, {
  message: "At least one field must be provided",
});

export const addGroupMemberRequestSchema = z.object({
  userId: z.coerce.number().int().positive(),
  role: groupRoleSchema.default("MEMBER"),
});

export const joinGroupByInviteRequestSchema = z.object({
  inviteCode: z.string().trim().min(1).max(120),
});

export const groupPreviewMemberSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  netPnl: z.string(),
});

export const groupSummarySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  inviteCode: z.string().nullable(),
  currentUserRole: groupRoleSchema,
  memberCount: z.number().int().nonnegative(),
  activeWagerCount: z.number().int().nonnegative(),
  netPnl: z.string(),
  topMembers: z.array(groupPreviewMemberSchema),
  createdAt: z.string().nullable(),
});

export const groupMemberSummarySchema = userSummarySchema.extend({
  membershipId: z.number().int(),
  groupRole: groupRoleSchema,
  joinedAt: z.string().nullable(),
  netPnl: z.string(),
});

export const paginatedGroupsResponseSchema = z.object({
  data: z.array(groupSummarySchema),
  pagination: paginationMetaSchema,
});

export const groupResponseSchema = z.object({
  data: groupSummarySchema,
});

export const paginatedGroupMembersResponseSchema = z.object({
  data: z.array(groupMemberSummarySchema),
  pagination: paginationMetaSchema,
});

export const groupMemberResponseSchema = z.object({
  data: groupMemberSummarySchema,
});

export const groupActionResponseSchema = z.object({
  message: z.string(),
});

export const groupInvitationStatusSchema = z.enum(["PENDING", "ACCEPTED", "REJECTED"]);
export const groupInvitationDirectionSchema = z.enum(["incoming", "outgoing"]);

export const groupInvitationsListQuerySchema = paginationQuerySchema.extend({
  direction: groupInvitationDirectionSchema.default("incoming"),
});

export const sendGroupInvitationRequestSchema = z.object({
  addresseeId: z.coerce.number().int().positive(),
});

export const groupInvitationGroupSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().nullable(),
  memberCount: z.number().int().nonnegative(),
  activeWagerCount: z.number().int().nonnegative(),
  members: z.array(groupMemberSummarySchema),
});

export const groupInvitationSummarySchema = z.object({
  id: z.number().int(),
  status: groupInvitationStatusSchema,
  createdAt: z.string().nullable(),
  respondedAt: z.string().nullable(),
  group: groupInvitationGroupSchema,
  requester: userSummarySchema,
  addressee: userSummarySchema,
});

export const paginatedGroupInvitationsResponseSchema = z.object({
  data: z.array(groupInvitationSummarySchema),
  pagination: paginationMetaSchema,
});

export const groupInvitationResponseSchema = z.object({
  data: groupInvitationSummarySchema,
});



export type GroupRole = z.infer<typeof groupRoleSchema>;
export type UpdateGroupMemberRoleRequest = z.infer<typeof updateGroupMemberRoleRequestSchema>;
export type GroupsListQuery = z.infer<typeof groupsListQuerySchema>;
export type GroupMembersListQuery = z.infer<typeof groupMembersListQuerySchema>;
export type CreateGroupRequest = z.infer<typeof createGroupRequestSchema>;
export type UpdateGroupRequest = z.infer<typeof updateGroupRequestSchema>;
export type AddGroupMemberRequest = z.infer<typeof addGroupMemberRequestSchema>;
export type JoinGroupByInviteRequest = z.infer<typeof joinGroupByInviteRequestSchema>;
export type GroupSummary = z.infer<typeof groupSummarySchema>;
export type GroupMemberSummary = z.infer<typeof groupMemberSummarySchema>;
export type GroupPreviewMember = z.infer<typeof groupPreviewMemberSchema>;

export type GroupInvitationDirection = z.infer<typeof groupInvitationDirectionSchema>;
export type GroupInvitationsListQuery = z.infer<typeof groupInvitationsListQuerySchema>;
export type SendGroupInvitationRequest = z.infer<typeof sendGroupInvitationRequestSchema>;
export type GroupInvitationSummary = z.infer<typeof groupInvitationSummarySchema>;