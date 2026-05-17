import { Elysia } from "elysia";
import { z } from "zod";
import {
  getMeResponseSchema,
  updateEmailRequestSchema,
  updateNicknameRequestSchema,
  updatePasswordRequestSchema,
  userMutationResponseSchema,
} from "@pb138/shared/schemas/user";
import { searchUsersByEmail, updateEmail, updateNickname, updatePassword } from "../../services/user";
import { getOptionalAuthenticatedUser, getAuthenticatedUser, authPlugin, type AuthContextLike } from "../../plugins/auth";

export const profileRoutes = new Elysia()
  .use(authPlugin)
  // Protected: Get Me
  .get("/me", async (context) => {
    const user = await getOptionalAuthenticatedUser(context as AuthContextLike);
    if (!user) {
      context.set.status = 401;
      return { message: "Unauthorized" };
    }
    return getMeResponseSchema.parse({ data: user });
  })

  // Protected: Search users by email prefix (for wager invites)
  .get("/search", async (context) => {
    const currentUser = await getAuthenticatedUser(context as AuthContextLike);
    const emailQuery = z.string().min(1).max(200).parse(context.query.email);
    const data = await searchUsersByEmail(emailQuery, currentUser.id);
    return { data };
  })

  .patch("/nickname", async (context) => {
    const currentUser = await getAuthenticatedUser(context as AuthContextLike);
    const parsedBody = updateNicknameRequestSchema.parse(context.body);
    const data = await updateNickname(currentUser.id, parsedBody.nickname);
    return userMutationResponseSchema.parse({ data });
  })

  .patch("/email", async (context) => {
    const currentUser = await getAuthenticatedUser(context as AuthContextLike);
    const parsedBody = updateEmailRequestSchema.parse(context.body);
    const data = await updateEmail(currentUser.id, parsedBody.newEmail, parsedBody.currentPassword);
    return userMutationResponseSchema.parse({ data });
  })

  .patch("/password", async (context) => {
    const currentUser = await getAuthenticatedUser(context as AuthContextLike);
    const parsedBody = updatePasswordRequestSchema.parse(context.body);
    const data = await updatePassword(currentUser.id, parsedBody.oldPassword, parsedBody.newPassword);
    return userMutationResponseSchema.parse({ data });
  });
