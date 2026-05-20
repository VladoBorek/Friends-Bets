import { Elysia } from "elysia";
import { z } from "zod";
import {
  addGroupMemberRequestSchema,
  createGroupRequestSchema,
  groupActionResponseSchema,
  groupInvitationResponseSchema,
  groupInvitationsListQuerySchema,
  groupMemberResponseSchema,
  groupMembersListQuerySchema,
  groupResponseSchema,
  groupsListQuerySchema,
  joinGroupByInviteRequestSchema,
  paginatedGroupInvitationsResponseSchema,
  paginatedGroupMembersResponseSchema,
  paginatedGroupsResponseSchema,
  sendGroupInvitationRequestSchema,
  updateGroupRequestSchema,
} from "@pb138/shared/schemas/groups";
import { authPlugin, getAuthenticatedUser } from "../plugins/auth";
import {
  acceptGroupInvitation,
  addGroupMember,
  createGroup,
  deleteGroup,
  getGroup,
  joinGroupByInvite,
  leaveGroup,
  listGroupInvitations,
  listGroupMembers,
  listGroups,
  rejectGroupInvitation,
  removeGroupMember,
  sendGroupInvitation,
  updateGroup,
} from "../services/groups";

const groupIdParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
});

const groupMemberParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
});

const invitationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const groupRoutes = new Elysia({ prefix: "/groups" })
  .use(authPlugin)
  .get("", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const query = groupsListQuerySchema.parse(context.query);
    const result = await listGroups(actor.id, query);

    return paginatedGroupsResponseSchema.parse(result);
  })
  .post("", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const body = createGroupRequestSchema.parse(context.body);
    const data = await createGroup(actor.id, body);

    context.set.status = 201;

    return groupResponseSchema.parse({ data });
  })
  .post("/join", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const body = joinGroupByInviteRequestSchema.parse(context.body);
    const data = await joinGroupByInvite(actor.id, body);

    context.set.status = 201;

    return groupResponseSchema.parse({ data });
  })
  .get("/invitations", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const query = groupInvitationsListQuerySchema.parse(context.query);
    const result = await listGroupInvitations(actor.id, query);

    return paginatedGroupInvitationsResponseSchema.parse(result);
  })
  .post("/invitations/:id/accept", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = invitationIdParamsSchema.parse(context.params);
    const data = await acceptGroupInvitation(actor.id, params.id);

    return groupInvitationResponseSchema.parse({ data });
  })
  .post("/invitations/:id/reject", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = invitationIdParamsSchema.parse(context.params);
    const data = await rejectGroupInvitation(actor.id, params.id);

    return groupInvitationResponseSchema.parse({ data });
  })
  .post("/:groupId/invitations", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);
    const body = sendGroupInvitationRequestSchema.parse(context.body);
    const data = await sendGroupInvitation(actor.id, params.groupId, body);

    context.set.status = 201;

    return groupInvitationResponseSchema.parse({ data });
  })
  .get("/:groupId", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);
    const data = await getGroup(actor.id, params.groupId);

    return groupResponseSchema.parse({ data });
  })
  .patch("/:groupId", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);
    const body = updateGroupRequestSchema.parse(context.body);
    const data = await updateGroup(actor, params.groupId, body);

    return groupResponseSchema.parse({ data });
  })
  .delete("/:groupId", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);

    await deleteGroup(actor.id, params.groupId);

    context.set.status = 204;
    return null;
  })
  .post("/:groupId/leave", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);

    await leaveGroup(actor.id, params.groupId);

    return groupActionResponseSchema.parse({
      data: {
        message: "Left group successfully",
      },
    });
  })
  .get("/:groupId/members", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);
    const query = groupMembersListQuerySchema.parse(context.query);
    const result = await listGroupMembers(actor.id, params.groupId, query);

    return paginatedGroupMembersResponseSchema.parse(result);
  })
  .post("/:groupId/members", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);
    const body = addGroupMemberRequestSchema.parse(context.body);
    const data = await addGroupMember(actor.id, params.groupId, body);

    context.set.status = 201;

    return groupMemberResponseSchema.parse({ data });
  })
  .delete("/:groupId/members/:userId", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupMemberParamsSchema.parse(context.params);

    await removeGroupMember(actor.id, params.groupId, params.userId);

    context.set.status = 204;
    return null;
  });