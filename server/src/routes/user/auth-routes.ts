import { Elysia } from "elysia";
import {
  createUserRequestSchema,
  loginRequestSchema,
  loginResponseSchema,
  requestPasswordResetRequestSchema,
  resetPasswordRequestSchema,
  resendVerificationByEmailRequestSchema,
  userActionResponseSchema,
  verifyEmailRequestSchema,
  verifyEmailResponseSchema,
} from "@pb138/shared/schemas/user";
import {
  createUser,
  getUserByCredentials,
  getUserByEmail,
  requestPasswordReset,
  resendVerificationEmailByAddress,
  resetPasswordByToken,
  verifyEmailToken,
} from "../../services/user";
import { authPlugin } from "../../plugins/auth";

const SESSION_MAX_AGE_SECONDS = 7 * 86400;

export const authRoutes = new Elysia()
  .use(authPlugin)

  .post("/login", async ({ body, jwt, cookie: { auth_session } }) => {
    const parsedBody = loginRequestSchema.parse(body);
    const user = await getUserByCredentials(parsedBody);

    const token = await jwt.sign({
      id: user.id,
      role: user.roleName,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    });

    auth_session.set({
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return loginResponseSchema.parse({
      data: {
        message: "Logged in successfully",
      },
    });
  })

  .post("", async ({ body, jwt, cookie: { auth_session }, set }) => {
    const parsedBody = createUserRequestSchema.parse(body);
    const data = await createUser(parsedBody);

    const token = await jwt.sign({
      id: data.id,
      role: data.roleName,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    });

    auth_session.set({
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    set.status = 201;
    return { data };
  })

  .post("/logout", ({ cookie: { auth_session }, set }) => {
    auth_session.remove();
    set.status = 204;
    return null;
  })

  .post("/verify-email", async ({ body, jwt, cookie: { auth_session } }) => {
    const parsedBody = verifyEmailRequestSchema.parse(body);
    const data = await verifyEmailToken(parsedBody.token);

    const token = await jwt.sign({
      id: data.id,
      role: data.roleName,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    });

    auth_session.set({
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return verifyEmailResponseSchema.parse({ data });
  })

  .post("/resend-verification", async ({ body }) => {
    const parsedBody = resendVerificationByEmailRequestSchema.parse(body);
    const targetUser = await getUserByEmail(parsedBody.email);

    if (targetUser.isVerified) {
      return userActionResponseSchema.parse({
        data: {
          message: "Account is already verified.",
        },
      });
    }

    await resendVerificationEmailByAddress(parsedBody.email);

    return userActionResponseSchema.parse({
      data: {
        message: "Verification email resent.",
      },
    });
  })

  .post("/reset-password", async ({ body }) => {
    const parsedBody = resetPasswordRequestSchema.parse(body);
    await resetPasswordByToken(parsedBody.token, parsedBody.password);

    return userActionResponseSchema.parse({
      data: {
        message: "Password reset successful.",
      },
    });
  })

  .post("/request-password-reset", async ({ body }) => {
    const parsedBody = requestPasswordResetRequestSchema.parse(body);
    await requestPasswordReset(parsedBody.email);

    return userActionResponseSchema.parse({
      data: {
        message: "If an account exists for this email, a reset link has been sent.",
      },
    });
  });