import { Elysia } from "elysia";
import {
  createUserRequestSchema,
  loginRequestSchema,
  loginResponseSchema,
  resetPasswordRequestSchema,
  resendVerificationByEmailRequestSchema,
  verifyEmailRequestSchema,
  verifyEmailResponseSchema,
} from "@pb138/shared/schemas/user";
import {
  createUser,
  getUserByCredentials,
  getUserByEmail,
  resendVerificationEmailByAddress,
  resetPasswordByToken,
  verifyEmailToken,
} from "../../services/user";
import { authPlugin } from "../../plugins/auth";

export const authRoutes = new Elysia()
  .use(authPlugin)
  
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
  
  // Register
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
      return { message: "Account is already verified." };
    }

    await resendVerificationEmailByAddress(parsedBody.email);
    return { message: "Verification email resent." };
  })

  // Public: reset password by token
  .post("/reset-password", async ({ body }) => {
    const parsedBody = resetPasswordRequestSchema.parse(body);
    await resetPasswordByToken(parsedBody.token, parsedBody.password);
    return { message: "Password reset successful." };
  });
