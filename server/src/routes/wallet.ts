import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import { HttpError } from "../errors";
import { getWalletOverview } from "../services/wallet-service";
import { getUserById } from "../services/user-service";
import { getWalletResponseSchema } from "../../../shared/src/schemas/wallet";

export const walletRoutes = new Elysia({ prefix: "/wallet" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-pb138",
    }),
  )
  .derive(async ({ jwt, cookie: { auth_session } }) => ({
    getCurrentUser: async () => {
      if (!auth_session || !auth_session.value) {
        throw new HttpError(401, "Unauthorized");
      }

      const profile = await jwt.verify(auth_session.value as string);
      if (!profile || !profile.id) {
        throw new HttpError(401, "Unauthorized");
      }

      return getUserById(Number(profile.id));
    },
  }))
  .get("/me", async ({ getCurrentUser }) => {
    const user = await getCurrentUser();
    const data = await getWalletOverview(user.id);
    return getWalletResponseSchema.parse({ data });
  });
