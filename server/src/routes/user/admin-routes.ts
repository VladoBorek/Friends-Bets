import { Elysia } from "elysia";
import { z } from "zod";
import {
  listUsersResponseSchema,
  suspendUserRequestSchema,
  updateUserRoleRequestSchema,
  userMutationResponseSchema,
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
import { getAuthenticatedUser, authPlugin } from "../../plugins/auth";

const userIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

async function ensureAdmin(context: any) {
  const user = await getAuthenticatedUser(context);
  if (user.roleName !== "ADMIN") {
    throw new HttpError(403, "Admin privileges required");
  }
  return user;
}

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .use(authPlugin)
  // List Users
  .get("/users", async (context) => {
    await ensureAdmin(context);
    const data = await listUsers();
    return listUsersResponseSchema.parse({ data });
  })

  // Admin role update
  .patch("/users/:id/role", async (context) => {
    const adminUser = await ensureAdmin(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    const parsedBody = updateUserRoleRequestSchema.parse(context.body);
    
    if (parsedParams.id === adminUser.id && parsedBody.roleName !== "ADMIN") {
      throw new HttpError(400, "Cannot demote yourself");
    }
    
    const data = await updateUserRole(parsedParams.id, parsedBody.roleName);
    return userMutationResponseSchema.parse({ data });
  })

  // Admin suspension
  .patch("/users/:id/suspend", async (context) => {
    await ensureAdmin(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    const parsedBody = suspendUserRequestSchema.parse(context.body);
    const data = await suspendUser(parsedParams.id, parsedBody.durationValue, parsedBody.durationUnit);
    return userMutationResponseSchema.parse({ data });
  })

  // Admin unsuspend
  .patch("/users/:id/unsuspend", async (context) => {
    await ensureAdmin(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    const data = await unsuspendUser(parsedParams.id);
    return userMutationResponseSchema.parse({ data });
  })

  // Admin resend verification email
  .post("/users/:id/resend-verification", async (context) => {
    await ensureAdmin(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    await resendVerificationEmail(parsedParams.id);
    return { message: "Verification email resent" };
  })

  // Admin password reset trigger
  .post("/users/:id/reset-password", async (context) => {
    await ensureAdmin(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    await sendAdminPasswordReset(parsedParams.id);
    return { message: "Password reset email sent." };
  })

  // Admin delete
  .delete("/users/:id", async (context) => {
    await ensureAdmin(context);
    const parsedParams = userIdParamsSchema.parse(context.params);
    await deleteUser(parsedParams.id);
    return { message: "User deleted successfully" };
  });
