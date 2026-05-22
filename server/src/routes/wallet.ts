import { Elysia } from "elysia";
import {
  getWalletResponseSchema,
  paginatedWalletTransactionsResponseSchema,
  walletBalanceMutationRequestSchema,
  walletBalanceMutationResponseSchema,
  walletTransactionsQuerySchema,
} from "@pb138/shared/schemas/wallet";
import {
  authPlugin,
  getAuthenticatedUser,
  type AuthContextLike,
} from "../plugins/auth";
import { ensureUserIsNotSuspended, ensureUserIsVerified } from "../services/wagers";
import {
  depositToWallet,
  getWalletOverview,
  getWalletTransactionsPaginated,
  withdrawFromWallet,
} from "../services/wallet";

export const walletRoutes = new Elysia({ prefix: "/wallet" })
  .use(authPlugin)
  .derive((context) => ({
    getCurrentUser: () => getAuthenticatedUser(context as AuthContextLike),
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