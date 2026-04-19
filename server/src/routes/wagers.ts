import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { z } from "zod";
import {
  createWagerRequestSchema,
  createWagerResponseSchema,
  getWagerResponseSchema,
  listCategoriesResponseSchema,
  listWagersResponseSchema,
  placeBetRequestSchema,
  placeBetResponseSchema,
  resolveWagerRequestSchema,
  resolveWagerResponseSchema,
} from "@pb138/shared/schemas/wager";
import { HttpError } from "../errors";
import {
  createWager,
  ensureUserIsNotSuspended,
  ensureUserIsVerified,
  getWagerById,
  listCategories,
  listWagers,
  placeBet,
  resolveWager,
} from "../services/wager-service";
import { getUserById } from "../services/user-service";

const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const wagerRoutes = new Elysia({ prefix: "/wagers" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-pb138",
    }),
  )
  .derive(async ({ jwt, cookie: { auth_session } }) => ({
    getCurrentUser: async () => {
      if (!auth_session || !auth_session.value) {
        throw new HttpError(401, "Unauthorized");
      }

      const profile = await jwt.verify(auth_session.value as string);
      if (!profile || !profile.id) {
        throw new HttpError(401, "Unauthorized");
      }

      return getUserById(Number(profile.id));
    },
    getOptionalCurrentUser: async () => {
      if (!auth_session || !auth_session.value) {
        return null;
      }

      const profile = await jwt.verify(auth_session.value as string);
      if (!profile || !profile.id) {
        return null;
      }

      try {
        return await getUserById(Number(profile.id));
      } catch {
        return null;
      }
    },
  }))
  .get("", async ({ getOptionalCurrentUser }) => {
    const currentUser = await getOptionalCurrentUser();
    const data = await listWagers(currentUser?.id);
    return listWagersResponseSchema.parse({ data });
  })
  .get("/categories", async () => {
    const data = await listCategories();
    return listCategoriesResponseSchema.parse({ data });
  })
  .get("/:id", async ({ params, getOptionalCurrentUser }) => {
    const parsedParams = idParamsSchema.parse(params);
    const currentUser = await getOptionalCurrentUser();
    const data = await getWagerById(parsedParams.id, currentUser?.id);
    return getWagerResponseSchema.parse({ data });
  })
  .post("", async ({ body, getCurrentUser }) => {
    const creator = await getCurrentUser();
    ensureUserIsVerified(creator);
    ensureUserIsNotSuspended(creator);
    const parsedBody = createWagerRequestSchema.parse(body);
    const data = await createWager(parsedBody, creator.id);
    return createWagerResponseSchema.parse({ data });
  })
  .post("/:id/bets", async ({ params, body, getCurrentUser }) => {
    const parsedParams = idParamsSchema.parse(params);
    const parsedBody = placeBetRequestSchema.parse(body);
    const user = await getCurrentUser();
    ensureUserIsVerified(user);
    ensureUserIsNotSuspended(user);
    const data = await placeBet(parsedParams.id, parsedBody, user.id);
    return placeBetResponseSchema.parse({ data });
  })
  // TEMPORARY: this shortcut lets any authenticated user close a wager while the admin flow is unfinished.
  .patch("/:id/resolve", async ({ params, body, getCurrentUser }) => {
    const parsedParams = idParamsSchema.parse(params);
    const parsedBody = resolveWagerRequestSchema.parse(body);
    await getCurrentUser();
    const data = await resolveWager(parsedParams.id, parsedBody);
    return resolveWagerResponseSchema.parse({ data });
  });
