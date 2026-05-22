import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { readServerConfig } from "../config";
import { HttpError } from "../errors";
import type { WideEventBuilder } from "../observability";
import { getUserById } from "../services/user";

export const authPlugin = new Elysia({ name: "auth-plugin" }).use(
  jwt({
    name: "jwt",
    secret: readServerConfig().secrets.jwt,
  }),
);

export type AuthContextLike = {
  jwt: {
    verify(token: string): Promise<unknown>;
  };
  cookie: {
    auth_session?: {
      value?: string;
    };
  };
  wideEvent?: WideEventBuilder;
};

function isJwtProfile(value: unknown): value is { id: number } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      typeof value.id === "number",
  );
}

export async function getAuthenticatedUser(context: AuthContextLike) {
  const token = context.cookie.auth_session?.value;

  if (!token) {
    throw new HttpError({
      status: 401,
      code: "AUTH_REQUIRED",
      message: "Authentication is required",
    });
  }

  const profile = await context.jwt.verify(token);

  if (!isJwtProfile(profile)) {
    throw new HttpError({
      status: 401,
      code: "AUTH_INVALID_SESSION",
      message: "Authentication session is invalid",
    });
  }

  const user = await getUserById(profile.id);
  context.wideEvent?.setUserId(user.id);

  return user;
}

export async function ensureAdmin(context: AuthContextLike) {
  const user = await getAuthenticatedUser(context);

  if (user.roleName !== "ADMIN") {
    throw new HttpError({
      status: 403,
      code: "AUTH_FORBIDDEN",
      message: "Admin privileges required",
    });
  }

  return user;
}

export async function getOptionalAuthenticatedUser(context: AuthContextLike) {
  const token = context.cookie.auth_session?.value;

  if (!token) {
    return null;
  }

  try {
    const profile = await context.jwt.verify(token);

    if (!isJwtProfile(profile)) {
      return null;
    }

    const user = await getUserById(profile.id);
    context.wideEvent?.setUserId(user.id);

    return user;
  } catch {
    return null;
  }
}