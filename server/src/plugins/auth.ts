import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { HttpError } from "../errors";
import { getUserById } from "../services/user";
import { readServerConfig } from "../config";

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
};

export async function getAuthenticatedUser(context: AuthContextLike) {
  const token = context.cookie.auth_session?.value;

  if (!token) {
    throw new HttpError(401, "Unauthorized");
  }

  const profile = await context.jwt.verify(token);

  if (
    !profile ||
    typeof profile !== "object" ||
    !("id" in profile) ||
    typeof profile.id !== "number"
  ) {
    throw new HttpError(401, "Unauthorized");
  }

  return getUserById(profile.id);
}

export async function getOptionalAuthenticatedUser(context: AuthContextLike) {
  const token = context.cookie.auth_session?.value;

  if (!token) {
    return null;
  }

  try {
    const profile = await context.jwt.verify(token);

    if (
      !profile ||
      typeof profile !== "object" ||
      !("id" in profile) ||
      typeof profile.id !== "number"
    ) {
      return null;
    }

    return await getUserById(profile.id);
  } catch {
    return null;
  }
}
