import { Elysia } from "elysia";
import { z } from "zod";
import {
  addGroupMemberRequestSchema,
  createGroupRequestSchema,
  groupActionResponseSchema,
  groupMemberResponseSchema,
  groupMembersListQuerySchema,
  groupResponseSchema,
  groupsListQuerySchema,
  joinGroupByInviteRequestSchema,
  paginatedGroupMembersResponseSchema,
  paginatedGroupsResponseSchema,
  updateGroupRequestSchema,
} from "@pb138/shared/schemas/groups";
import { authPlugin, getAuthenticatedUser } from "../plugins/auth";
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  getGroup,
  joinGroupByInvite,
  leaveGroup,
  listGroupMembers,
  listGroups,
  removeGroupMember,
  updateGroup,
} from "../services/groups";

const groupIdParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
});

const groupMemberParamsSchema = z.object({
  groupId: z.coerce.number().int().positive(),
  userId: z.coerce.number().int().positive(),
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

    return groupResponseSchema.parse({ data });
  })
  .post("/join", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const body = joinGroupByInviteRequestSchema.parse(context.body);
    const data = await joinGroupByInvite(actor.id, body);

    return groupResponseSchema.parse({ data });
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
    const data = await updateGroup(actor.id, params.groupId, body);

    return groupResponseSchema.parse({ data });
  })
  .delete("/:groupId", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);

    await deleteGroup(actor.id, params.groupId);

    return groupActionResponseSchema.parse({ message: "Group deleted successfully" });
  })
  .post("/:groupId/leave", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupIdParamsSchema.parse(context.params);

    await leaveGroup(actor.id, params.groupId);

    return groupActionResponseSchema.parse({ message: "Left group successfully" });
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

    return groupMemberResponseSchema.parse({ data });
  })
  .delete("/:groupId/members/:userId", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const params = groupMemberParamsSchema.parse(context.params);

    await removeGroupMember(actor.id, params.groupId, params.userId);

    return groupActionResponseSchema.parse({ message: "Group member removed successfully" });
  });