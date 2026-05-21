import { jwt } from "@elysiajs/jwt";
import {
  categoriesListQuerySchema,
  categoryResponseSchema,
  createWagerRequestSchema,
  createWagerResponseSchema,
  getWagerResponseSchema,
  paginatedAdminCategoriesResponseSchema,
  paginatedCategoriesResponseSchema,
  paginatedWagerBetsResponseSchema,
  paginatedWagerCommentsResponseSchema,
  paginatedWagerInvitationsResponseSchema,
  paginatedWagersResponseSchema,
  placeBetRequestSchema,
  placeBetResponseSchema,
  resolveWagerRequestSchema,
  resolveWagerResponseSchema,
  wagerBetsListQuerySchema,
  wagerCommentResponseSchema,
  wagerCommentsListQuerySchema,
  wagerInvitationsListQuerySchema,
  wagersListQuerySchema,
} from "@pb138/shared/schemas/wager";
import { Elysia } from "elysia";
import { z } from "zod";
import { HttpError } from "../errors";
import type { WideEventBuilder } from "../observability";
import {
  createCategory,
  deleteCategory,
  listCategories,
  listCategoriesWithUsage,
} from "../services/category";
import { getUserById } from "../services/user";
import {
  closeWagerBetting,
  createComment,
  createWager,
  deleteWager,
  ensureUserIsNotSuspended,
  ensureUserIsVerified,
  getWagerById,
  listBets,
  listComments,
  listWagerInvitations,
  listWagers,
  placeBet,
  resolveWager,
  updateWager,
} from "../services/wagers";

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const createCategoryBodySchema = z.object({
  name: z.string().min(1).max(80),
});

type JwtProfile = {
  id?: unknown;
};

function getWideEvent(context: unknown): WideEventBuilder | undefined {
  if (context && typeof context === "object" && "wideEvent" in context) {
    return context.wideEvent as WideEventBuilder;
  }

  return undefined;
}

export const wagerRoutes = new Elysia({ prefix: "/wagers" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-pb138",
    }),
  )
  .derive(async (context) => ({
    getCurrentUser: async () => {
      const {
        jwt,
        cookie: { auth_session },
      } = context;

      if (!auth_session?.value) {
        throw new HttpError({
          status: 401,
          code: "AUTH_REQUIRED",
          message: "Authentication is required",
        });
      }

      const profile = (await jwt.verify(auth_session.value as string)) as JwtProfile | false;

      if (!profile || typeof profile.id !== "number") {
        throw new HttpError({
          status: 401,
          code: "AUTH_INVALID_SESSION",
          message: "Authentication session is invalid",
        });
      }

      const user = await getUserById(profile.id);
      getWideEvent(context)?.setUserId(user.id);

      return user;
    },
    getOptionalCurrentUser: async () => {
      const {
        jwt,
        cookie: { auth_session },
      } = context;

      if (!auth_session?.value) {
        return null;
      }

      const profile = (await jwt.verify(auth_session.value as string)) as JwtProfile | false;

      if (!profile || typeof profile.id !== "number") {
        return null;
      }

      try {
        const user = await getUserById(profile.id);
        getWideEvent(context)?.setUserId(user.id);

        return user;
      } catch {
        return null;
      }
    },
  }))
  .get("", async ({ query, getOptionalCurrentUser }) => {
    const currentUser = await getOptionalCurrentUser();
    const parsedQuery = wagersListQuerySchema.parse(query);
    const result = await listWagers(parsedQuery, currentUser?.id);

    return paginatedWagersResponseSchema.parse(result);
  })
  .get("/categories", async ({ query }) => {
    const parsedQuery = categoriesListQuerySchema.parse(query);
    const result = await listCategories(parsedQuery);

    return paginatedCategoriesResponseSchema.parse(result);
  })
  .get("/categories/admin", async ({ query, getCurrentUser }) => {
    const user = await getCurrentUser();

    if (user.roleName !== "ADMIN") {
      throw new HttpError({
        status: 403,
        code: "AUTH_FORBIDDEN",
        message: "Admin privileges required",
      });
    }

    const parsedQuery = categoriesListQuerySchema.parse(query);
    const result = await listCategoriesWithUsage(parsedQuery);

    return paginatedAdminCategoriesResponseSchema.parse(result);
  })
  .post("/categories", async ({ body, getCurrentUser, set }) => {
    const user = await getCurrentUser();

    if (user.roleName !== "ADMIN") {
      throw new HttpError({
        status: 403,
        code: "AUTH_FORBIDDEN",
        message: "Admin privileges required",
      });
    }

    const parsedBody = createCategoryBodySchema.parse(body);
    const data = await createCategory(parsedBody.name);

    set.status = 201;

    return categoryResponseSchema.parse({ data });
  })
  .delete("/categories/:id", async ({ params, getCurrentUser, set }) => {
    const user = await getCurrentUser();

    if (user.roleName !== "ADMIN") {
      throw new HttpError({
        status: 403,
        code: "AUTH_FORBIDDEN",
        message: "Admin privileges required",
      });
    }

    const parsedParams = idParamsSchema.parse(params);

    await deleteCategory(parsedParams.id);

    set.status = 204;
    return null;
  })
  .get("/:id", async ({ params, getOptionalCurrentUser }) => {
    const parsedParams = idParamsSchema.parse(params);
    const currentUser = await getOptionalCurrentUser();
    const data = await getWagerById(parsedParams.id, currentUser?.id);

    return getWagerResponseSchema.parse({ data });
  })
  .post("", async ({ body, getCurrentUser, set }) => {
    const creator = await getCurrentUser();

    ensureUserIsVerified(creator);
    ensureUserIsNotSuspended(creator);

    const parsedBody = createWagerRequestSchema.parse(body);
    const data = await createWager(parsedBody, creator.id);

    set.status = 201;

    return createWagerResponseSchema.parse({ data });
  })
  .patch("/:id", async ({ params, body, getCurrentUser }) => {
    const parsedParams = idParamsSchema.parse(params);
    const parsedBody = createWagerRequestSchema.parse(body);
    const user = await getCurrentUser();
    const data = await updateWager(parsedParams.id, parsedBody, user.id);

    return getWagerResponseSchema.parse({ data });
  })
  .delete("/:id", async ({ params, getCurrentUser, set }) => {
    const parsedParams = idParamsSchema.parse(params);
    const user = await getCurrentUser();

    await deleteWager(parsedParams.id, user.id);

    set.status = 204;
    return null;
  })
  .get("/:id/invitations", async ({ params, query, getCurrentUser }) => {
    const parsedParams = idParamsSchema.parse(params);
    const parsedQuery = wagerInvitationsListQuerySchema.parse(query);
    const user = await getCurrentUser();
    const result = await listWagerInvitations(parsedParams.id, user.id, parsedQuery);

    return paginatedWagerInvitationsResponseSchema.parse(result);
  })
  .post("/:id/bets", async ({ params, body, getCurrentUser, set }) => {
    const parsedParams = idParamsSchema.parse(params);
    const parsedBody = placeBetRequestSchema.parse(body);
    const user = await getCurrentUser();

    ensureUserIsVerified(user);
    ensureUserIsNotSuspended(user);

    const data = await placeBet(parsedParams.id, parsedBody, user.id);

    set.status = 201;

    return placeBetResponseSchema.parse({ data });
  })
  .get("/:id/bets", async ({ params, query, getOptionalCurrentUser }) => {
    const parsedParams = idParamsSchema.parse(params);
    const parsedQuery = wagerBetsListQuerySchema.parse(query);
    const currentUser = await getOptionalCurrentUser();
    const result = await listBets(parsedParams.id, currentUser?.id, parsedQuery);

    return paginatedWagerBetsResponseSchema.parse(result);
  })
  .get("/:id/comments", async ({ params, query, getOptionalCurrentUser }) => {
    const parsedParams = idParamsSchema.parse(params);
    const parsedQuery = wagerCommentsListQuerySchema.parse(query);
    const currentUser = await getOptionalCurrentUser();
    const result = await listComments(parsedParams.id, currentUser?.id, parsedQuery);

    return paginatedWagerCommentsResponseSchema.parse(result);
  })
  .post("/:id/comments", async ({ params, body, getCurrentUser, set }) => {
    const parsedParams = idParamsSchema.parse(params);
    const user = await getCurrentUser();

    ensureUserIsVerified(user, "comment");
    ensureUserIsNotSuspended(user, "comment");

    const { content } = z.object({ content: z.string().min(1).max(2000) }).parse(body);
    const data = await createComment(parsedParams.id, user.id, content);

    set.status = 201;

    return wagerCommentResponseSchema.parse({ data });
  })
  .patch("/:id/close", async ({ params, getCurrentUser }) => {
    const parsedParams = idParamsSchema.parse(params);
    const user = await getCurrentUser();
    const data = await closeWagerBetting(parsedParams.id, user.id);

    return getWagerResponseSchema.parse({ data });
  })
  .patch("/:id/resolve", async ({ params, body, getCurrentUser }) => {
    const parsedParams = idParamsSchema.parse(params);
    const parsedBody = resolveWagerRequestSchema.parse(body);
    const user = await getCurrentUser();
    const wager = await getWagerById(parsedParams.id, user.id);

    if (wager.createdById !== user.id) {
      throw new HttpError({
        status: 403,
        code: "WAGER_FORBIDDEN",
        message: "Only the wager creator can resolve the wager",
      });
    }

    const data = await resolveWager(parsedParams.id, parsedBody);

    return resolveWagerResponseSchema.parse({ data });
  });