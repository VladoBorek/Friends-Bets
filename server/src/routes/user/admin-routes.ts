import { Elysia } from "elysia";
import { z } from "zod";
import {
  listUsersResponseSchema,
  suspendUserRequestSchema,
  updateUserRoleRequestSchema,
  userActionResponseSchema,
  userMutationResponseSchema,
  usersListQuerySchema,
} from "@pb138/shared/schemas/user";
import {
  deleteUser,
  listUsers,
  resendVerificationEmail,
  sendAdminPasswordReset,
  suspendUser,
  unsuspendUser,
  updateUserRole,
} from "../../services/user";
import { HttpError } from "../../errors";
import { authPlugin, getAuthenticatedUser, type AuthContextLike } from "../../plugins/auth";

const userIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

async function ensureAdmin(context: AuthContextLike) {
  const user = await getAuthenticatedUser(context);

  if (user.roleName !== "ADMIN") {
    throw new HttpError(403, "FORBIDDEN", "Admin privileges required");
  }

  return user;
}

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(authPlugin)

  .get("/users", async (context) => {
    await ensureAdmin(context);
    const query = usersListQuerySchema.parse(context.query);
    const result = await listUsers(query);

    return listUsersResponseSchema.parse(result);
  })

  .patch("/users/:id/role", async (context) => {
    const adminUser = await ensureAdmin(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    const parsedBody = updateUserRoleRequestSchema.parse(context.body);

    if (parsedParams.id === adminUser.id && parsedBody.roleName !== "ADMIN") {
      throw new HttpError(400, "BAD_REQUEST", "Cannot demote yourself");
    }

    const data = await updateUserRole(parsedParams.id, parsedBody.roleName);

    return userMutationResponseSchema.parse({ data });
  })

  .patch("/users/:id/suspend", async (context) => {
    await ensureAdmin(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    const parsedBody = suspendUserRequestSchema.parse(context.body);
    const data = await suspendUser(parsedParams.id, parsedBody.durationValue, parsedBody.durationUnit);

    return userMutationResponseSchema.parse({ data });
  })

  .patch("/users/:id/unsuspend", async (context) => {
    await ensureAdmin(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    const data = await unsuspendUser(parsedParams.id);

    return userMutationResponseSchema.parse({ data });
  })

  .post("/users/:id/resend-verification", async (context) => {
    await ensureAdmin(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    await resendVerificationEmail(parsedParams.id);

    return userActionResponseSchema.parse({
      data: {
        message: "Verification email resent",
      },
    });
  })

  .post("/users/:id/reset-password", async (context) => {
    await ensureAdmin(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    await sendAdminPasswordReset(parsedParams.id);

    return userActionResponseSchema.parse({
      data: {
        message: "Password reset email sent.",
      },
    });
  })

  .delete("/users/:id", async (context) => {
    await ensureAdmin(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    await deleteUser(parsedParams.id);

    context.set.status = 204;
    return null;
  });