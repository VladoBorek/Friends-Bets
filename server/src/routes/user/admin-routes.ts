import { Elysia } from "elysia";
import { z } from "zod";
import {
  listUsersResponseSchema,
  resetPasswordByAdminResponseSchema,
  suspendUserRequestSchema,
  updateUserRoleRequestSchema,
  userActionResponseSchema,
  userDeleteResponseSchema,
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

const userIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const adminRoutes = new Elysia({ prefix: "/admin" })
  .derive(async ({ getCurrentUser }: any) => {
    const user = await getCurrentUser();
    if (user.roleName !== "ADMIN") {
      throw new HttpError(403, "Admin privileges required");
    }
    return { adminUser: user };
  })
  
  // List Users
  .get("/users", async () => {
    const data = await listUsers();
    return listUsersResponseSchema.parse({ data });
  })

  // Admin role update
  .patch("/users/:id/role", async ({ adminUser, params, body }) => {
    const parsedParams = userIdParamsSchema.parse(params);
    const parsedBody = updateUserRoleRequestSchema.parse(body);
    if (parsedParams.id === adminUser.id && parsedBody.roleName !== "ADMIN") {
      throw new HttpError(400, "Cannot demote yourself");
    }
    const data = await updateUserRole(parsedParams.id, parsedBody.roleName);
    return userMutationResponseSchema.parse({ data });
  })

  // Admin suspension
  .patch("/users/:id/suspend", async ({ params, body }) => {
    const parsedParams = userIdParamsSchema.parse(params);
    const parsedBody = suspendUserRequestSchema.parse(body);
    const data = await suspendUser(parsedParams.id, parsedBody.durationValue, parsedBody.durationUnit);
    return userMutationResponseSchema.parse({ data });
  })

  // Admin unsuspend
  .patch("/users/:id/unsuspend", async ({ params }) => {
    const parsedParams = userIdParamsSchema.parse(params);
    const data = await unsuspendUser(parsedParams.id);
    return userMutationResponseSchema.parse({ data });
  })

  // Admin resend verification email
  .post("/users/:id/resend-verification", async ({ params }) => {
    const parsedParams = userIdParamsSchema.parse(params);
    await resendVerificationEmail(parsedParams.id);
    return { message: "Verification email resent" };
  })

  // Admin password reset trigger
  .post("/users/:id/reset-password", async ({ params }) => {
    const parsedParams = userIdParamsSchema.parse(params);
    await sendAdminPasswordReset(parsedParams.id);
    return { message: "Password reset email sent." };
  })

  // Admin delete
  .delete("/users/:id", async ({ params }) => {
    const parsedParams = userIdParamsSchema.parse(params);
    await deleteUser(parsedParams.id);
    return { message: "User deleted successfully" };
  });
