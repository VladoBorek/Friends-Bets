import { jwt } from "@elysiajs/jwt";
import { Elysia } from "elysia";
import {
  getWalletResponseSchema,
  paginatedWalletTransactionsResponseSchema,
  walletBalanceMutationRequestSchema,
  walletBalanceMutationResponseSchema,
  walletTransactionsQuerySchema,
} from "@pb138/shared/schemas/wallet";
import { HttpError } from "../errors";
import { getUserById } from "../services/user";
import { ensureUserIsNotSuspended, ensureUserIsVerified } from "../services/wagers";
import {
  depositToWallet,
  getWalletOverview,
  getWalletTransactionsPaginated,
  withdrawFromWallet,
} from "../services/wallet";

export const walletRoutes = new Elysia({ prefix: "/wallet" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-pb138",
    }),
  )
  .derive(async ({ jwt, cookie: { auth_session } }) => ({
    getCurrentUser: async () => {
      if (!auth_session?.value) {
        throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
      }

      const profile = await jwt.verify(auth_session.value as string);
      if (!profile || !profile.id) {
        throw new HttpError(401, "UNAUTHORIZED", "Unauthorized");
      }

      return getUserById(Number(profile.id));
    },
  }))
  .get("/me", async ({ getCurrentUser }) => {
    const user = await getCurrentUser();
    const data = await getWalletOverview(user.id);

    return getWalletResponseSchema.parse({ data });
  })
  .get("/transactions", async ({ query, getCurrentUser }) => {
    const user = await getCurrentUser();
    const parsedQuery = walletTransactionsQuerySchema.parse(query);
    const result = await getWalletTransactionsPaginated(user.id, parsedQuery);

    return paginatedWalletTransactionsResponseSchema.parse(result);
  })
  .post("/deposit", async ({ body, getCurrentUser }) => {
    const user = await getCurrentUser();
    ensureUserIsVerified(user);
    ensureUserIsNotSuspended(user);

    const parsedBody = walletBalanceMutationRequestSchema.parse(body);
    const data = await depositToWallet(user.id, parsedBody.amount);

    return walletBalanceMutationResponseSchema.parse({ data });
  })
  .post("/withdraw", async ({ body, getCurrentUser }) => {
    const user = await getCurrentUser();
    ensureUserIsVerified(user);
    ensureUserIsNotSuspended(user);

    const parsedBody = walletBalanceMutationRequestSchema.parse(body);
    const data = await withdrawFromWallet(user.id, parsedBody.amount);

    return walletBalanceMutationResponseSchema.parse({ data });
  });