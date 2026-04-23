import { Elysia } from "elysia";
import { z } from "zod";
import { getMeResponseSchema } from "@pb138/shared/schemas/user";
import { searchUsersByEmail } from "../../services/user";
import { getOptionalAuthenticatedUser, getAuthenticatedUser, authPlugin } from "../../plugins/auth";
import { HttpError } from "../../errors";

export const profileRoutes = new Elysia()
  .use(authPlugin)
  // Protected: Get Me (using optional to avoid throwing in derive if not wanted, but here we want it)
  .get("/me", async (context) => {
    const user = await getOptionalAuthenticatedUser(context as any);
    if (!user) {
      throw new HttpError(401, "Unauthorized");
    }
    return getMeResponseSchema.parse({ data: user });
  })

  // Protected: Search users by email prefix (for wager invites)
  .get("/search", async (context) => {
    const currentUser = await getAuthenticatedUser(context as any);
    const emailQuery = z.string().min(1).max(200).parse(context.query.email);
    const data = await searchUsersByEmail(emailQuery, currentUser.id);
    return { data };
  });
