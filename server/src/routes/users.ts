import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import {
  createUserRequestSchema,
  getMeResponseSchema,
  listUsersResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
  resetPasswordByAdminResponseSchema,
  resetPasswordRequestSchema,
  resendVerificationByEmailRequestSchema,
  suspendUserRequestSchema,
  updateUserRoleRequestSchema,
  userActionResponseSchema,
  userDeleteResponseSchema,
  userMutationResponseSchema,
  verifyEmailRequestSchema,
  verifyEmailResponseSchema,
} from "@pb138/shared/schemas/user";
import {
  createUser,
  deleteUser,
  getUserByCredentials,
  getUserByEmail,
  getUserById,
  listUsers,
  resendVerificationEmail,
  resendVerificationEmailByAddress,
  resetPasswordByToken,
  suspendUser,
  unsuspendUser,
  updateUserRole,
  verifyEmailToken,
  sendAdminPasswordReset,
} from "../services/user-service";
import { HttpError } from "../errors";
import { z } from "zod";

const userIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Setup Auth context with JWT and Cookie
export const userRoutes = new Elysia({ prefix: "/users" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-pb138",
    })
  )
  .derive(async ({ jwt, cookie: { auth_session } }) => {
    return {
      getCurrentUser: async () => {
        if (!auth_session || !auth_session.value) {
          throw new HttpError(401, "Unauthorized");
        }
        
        const profile = await jwt.verify(auth_session.value as string);
        if (!profile || !profile.id) {
          throw new HttpError(401, "Unauthorized");
        }
        
        // This validates the token ID exists in the DB
        return await getUserById(Number(profile.id));
      }
    };
  })
  
  // Public Login
  .post("/login", async ({ body, jwt, cookie: { auth_session } }) => {
    const parsedBody = loginRequestSchema.parse(body);
    const user = await getUserByCredentials(parsedBody);
    
    // Sign JWT
    const token = await jwt.sign({
      id: user.id,
      role: user.roleName,
      exp: Math.floor(Date.now() / 1000) + (7 * 86400) // 7 days expiration
    });
    
    // Set HttpOnly cookie
    auth_session.set({
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 7 * 86400,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    
    return loginResponseSchema.parse({ message: "Logged in successfully" });
  })
  
  // Register (Often protected, but public for demo if needed. Assuming public for bootstrapping)
  .post("", async ({ body, jwt, cookie: { auth_session } }) => {
    const parsedBody = createUserRequestSchema.parse(body);
    const user = await createUser(parsedBody);

    const token = await jwt.sign({
      id: user.id,
      role: user.roleName,
      exp: Math.floor(Date.now() / 1000) + (7 * 86400),
    });

    auth_session.set({
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 7 * 86400,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return { data: user };
  })
  
  // Public Logout
  .post("/logout", ({ cookie: { auth_session } }) => {
    auth_session.remove();
    return { message: "Logged out" };
  })

  // Public Email Verification
  .post("/verify-email", async ({ body, jwt, cookie: { auth_session } }) => {
    const parsedBody = verifyEmailRequestSchema.parse(body);
    const data = await verifyEmailToken(parsedBody.token);

    const token = await jwt.sign({
      id: data.id,
      role: data.roleName,
      exp: Math.floor(Date.now() / 1000) + (7 * 86400),
    });

    auth_session.set({
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 7 * 86400,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return verifyEmailResponseSchema.parse({ message: "Email verified successfully", data });
  })

  // Public: resend verification by email
  .post("/resend-verification", async ({ body }) => {
    const parsedBody = resendVerificationByEmailRequestSchema.parse(body);
    const targetUser = await getUserByEmail(parsedBody.email);
    if (targetUser.isVerified) {
      return userActionResponseSchema.parse({ message: "Account is already verified." });
    }

    await resendVerificationEmailByAddress(parsedBody.email);
    return userActionResponseSchema.parse({ message: "Verification email resent." });
  })

  // Public: reset password by token
  .post("/reset-password", async ({ body }) => {
    const parsedBody = resetPasswordRequestSchema.parse(body);
    await resetPasswordByToken(parsedBody.token, parsedBody.password);
    return resetPasswordByAdminResponseSchema.parse({ message: "Password reset successful." });
  })

  // Protected: Get Me
  .get("/me", async ({ getCurrentUser }) => {
    const user = await getCurrentUser();
    return getMeResponseSchema.parse({ data: user });
  })

  // Protected: List Users
  .get("", async ({ getCurrentUser }) => {
    await getCurrentUser(); // Guard
    const data = await listUsers();
    return listUsersResponseSchema.parse({ data });
  })

  // Protected: Admin role update
  .patch("/:id/role", async ({ getCurrentUser, params, body }) => {
    const actor = await getCurrentUser();
    if (actor.roleName !== "ADMIN") {
      throw new HttpError(403, "Admin privileges required");
    }

    const parsedParams = userIdParamsSchema.parse(params);
    const parsedBody = updateUserRoleRequestSchema.parse(body);
    if (parsedParams.id === actor.id && parsedBody.roleName !== "ADMIN") {
      throw new HttpError(400, "Cannot demote yourself");
    }
    const data = await updateUserRole(parsedParams.id, parsedBody.roleName);
    return userMutationResponseSchema.parse({ data });
  })

  // Protected: Admin suspension
  .patch("/:id/suspend", async ({ getCurrentUser, params, body }) => {
    const actor = await getCurrentUser();
    if (actor.roleName !== "ADMIN") {
      throw new HttpError(403, "Admin privileges required");
    }

    const parsedParams = userIdParamsSchema.parse(params);
    const parsedBody = suspendUserRequestSchema.parse(body);
    const data = await suspendUser(parsedParams.id, parsedBody.durationValue, parsedBody.durationUnit);
    return userMutationResponseSchema.parse({ data });
  })

  // Protected: Admin unsuspend
  .patch("/:id/unsuspend", async ({ getCurrentUser, params }) => {
    const actor = await getCurrentUser();
    if (actor.roleName !== "ADMIN") {
      throw new HttpError(403, "Admin privileges required");
    }

    const parsedParams = userIdParamsSchema.parse(params);
    const data = await unsuspendUser(parsedParams.id);
    return userMutationResponseSchema.parse({ data });
  })

  // Protected: Admin resend verification email
  .post("/:id/resend-verification", async ({ getCurrentUser, params }) => {
    const actor = await getCurrentUser();
    if (actor.roleName !== "ADMIN") {
      throw new HttpError(403, "Admin privileges required");
    }

    const parsedParams = userIdParamsSchema.parse(params);
    console.log("[Users Route] Admin resend verification", {
      actorId: actor.id,
      targetUserId: parsedParams.id,
    });
    await resendVerificationEmail(parsedParams.id);
    return userActionResponseSchema.parse({ message: "Verification email resent" });
  })

  // Protected: Admin password reset trigger
  .post("/:id/reset-password", async ({ getCurrentUser, params }) => {
    const actor = await getCurrentUser();
    if (actor.roleName !== "ADMIN") {
      throw new HttpError(403, "Admin privileges required");
    }

    const parsedParams = userIdParamsSchema.parse(params);
    await sendAdminPasswordReset(parsedParams.id);
    return resetPasswordByAdminResponseSchema.parse({ message: "Password reset email sent." });
  })

  // Protected: Admin delete
  .delete("/:id", async ({ getCurrentUser, params }) => {
    const actor = await getCurrentUser();
    if (actor.roleName !== "ADMIN") {
      throw new HttpError(403, "Admin privileges required");
    }

    const parsedParams = userIdParamsSchema.parse(params);
    await deleteUser(parsedParams.id);
    return userDeleteResponseSchema.parse({ message: "User deleted successfully" });
  });
