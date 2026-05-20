import { Elysia } from "elysia";
import {
  getMeResponseSchema,
  searchUsersResponseSchema,
  updateEmailRequestSchema,
  updateNicknameRequestSchema,
  updatePasswordRequestSchema,
  userMutationResponseSchema,
  userSearchQuerySchema,
} from "@pb138/shared/schemas/user";
import { searchUsersByEmail, updateEmail, updateNickname, updatePassword } from "../../services/user";
import {
  authPlugin,
  getAuthenticatedUser,
  type AuthContextLike,
} from "../../plugins/auth";

export const profileRoutes = new Elysia()
  .use(authPlugin)

  .get("/me", async (context) => {
    const user = await getAuthenticatedUser(context as AuthContextLike);
    return getMeResponseSchema.parse({ data: user });
  })

  .get("/search", async (context) => {
    const currentUser = await getAuthenticatedUser(context as AuthContextLike);
    const query = userSearchQuerySchema.parse(context.query);
    const result = await searchUsersByEmail(query, currentUser.id);

    return searchUsersResponseSchema.parse(result);
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