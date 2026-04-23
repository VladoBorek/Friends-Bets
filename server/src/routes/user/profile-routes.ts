import { Elysia } from "elysia";
import { z } from "zod";
import { getMeResponseSchema } from "@pb138/shared/schemas/user";
import { searchUsersByEmail } from "../../services/user";

export const profileRoutes = new Elysia()
  // Protected: Get Me
  .get("/me", async ({ getCurrentUser }) => {
    const user = await getCurrentUser();
    return getMeResponseSchema.parse({ data: user });
  })

  // Protected: Search users by email prefix (for wager invites)
  .get("/search", async ({ getCurrentUser, query }) => {
    const currentUser = await getCurrentUser();
    const emailQuery = z.string().min(1).max(200).parse(query.email);
    const data = await searchUsersByEmail(emailQuery, currentUser.id);
    return { data };
  });
