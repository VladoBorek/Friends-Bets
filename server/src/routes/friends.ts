import { Elysia } from "elysia";
import { z } from "zod";
import {
  friendDiscoveryQuerySchema,
  friendRequestsListQuerySchema,
  friendRequestResponseSchema,
  friendStatsResponseSchema,
  friendWagersListQuerySchema,
  friendsListQuerySchema,
  paginatedDiscoveredUsersResponseSchema,
  paginatedFriendRequestsResponseSchema,
  paginatedFriendsResponseSchema,
  paginatedFriendWagersResponseSchema,
  sendFriendRequestSchema,
} from "@pb138/shared/schemas/friends";
import { authPlugin, getAuthenticatedUser } from "../plugins/auth";
import {
  acceptFriendRequest,
  discoverUsers,
  getFriendStats,
  listFriendRequests,
  listFriends,
  listFriendWagers,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../services/friends";

const requestIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const userIdParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

export const friendRoutes = new Elysia({ prefix: "/friends" })
  .use(authPlugin)
  .get("", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedQuery = friendsListQuerySchema.parse(context.query);
    const result = await listFriends(actor.id, parsedQuery);

    return paginatedFriendsResponseSchema.parse(result);
  })
  .get("/discover", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedQuery = friendDiscoveryQuerySchema.parse(context.query);
    const result = await discoverUsers(actor.id, parsedQuery);

    return paginatedDiscoveredUsersResponseSchema.parse(result);
  })
  .get("/requests", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedQuery = friendRequestsListQuerySchema.parse(context.query);
    const result = await listFriendRequests(actor.id, parsedQuery);

    return paginatedFriendRequestsResponseSchema.parse(result);
  })
  .get("/:userId/stats", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    const data = await getFriendStats(actor.id, parsedParams.userId);

    return friendStatsResponseSchema.parse({ data });
  })
  .get("/:userId/wagers", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    const parsedQuery = friendWagersListQuerySchema.parse(context.query);
    const result = await listFriendWagers(actor.id, parsedParams.userId, parsedQuery);

    return paginatedFriendWagersResponseSchema.parse(result);
  })
  .post("/requests", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedBody = sendFriendRequestSchema.parse(context.body);
    const data = await sendFriendRequest(actor.id, parsedBody);

    context.set.status = 201;

    return friendRequestResponseSchema.parse({ data });
  })
  .post("/requests/:id/accept", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedParams = requestIdParamsSchema.parse(context.params);
    const data = await acceptFriendRequest(actor.id, parsedParams.id);

    return friendRequestResponseSchema.parse({ data });
  })
  .post("/requests/:id/reject", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedParams = requestIdParamsSchema.parse(context.params);
    const data = await rejectFriendRequest(actor.id, parsedParams.id);

    return friendRequestResponseSchema.parse({ data });
  })
  .delete("/:userId", async (context) => {
    const actor = await getAuthenticatedUser(context);
    const parsedParams = userIdParamsSchema.parse(context.params);

    await removeFriend(actor.id, parsedParams.userId);

    context.set.status = 204;
    return null;
  });