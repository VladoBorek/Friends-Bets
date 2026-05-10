import {
  getWalletResponseSchema,
  paginatedWalletTransactionsResponseSchema,
  walletTransactionsQuerySchema,
} from "@pb138/shared/schemas/wallet";
import type { WalletTransactionsQuery } from "@pb138/shared/schemas/wallet";

async function readJsonResponse(response: Response) {
  const rawBody = await response.text().catch(() => "");
  const trimmedBody = rawBody.trim();

  if (!trimmedBody) {
    return null;
  }

  try {
    return JSON.parse(trimmedBody) as unknown;
  } catch {
    return trimmedBody;
  }
}

function extractErrorMessage(body: unknown, fallbackMessage: string): string {
  if (typeof body === "string" && body.trim()) {
    return body.trim();
  }

  if (body && typeof body === "object") {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }

  return fallbackMessage;
}

export async function fetchWalletOverview() {
  const response = await fetch("/api/wallet/me", {
    method: "GET",
    credentials: "same-origin",
  });

  const json = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(json, "Unable to load wallet"));
  }

  return getWalletResponseSchema.parse(json);
}

export async function fetchWalletTransactions(input: {
  page: number;
  limit: number;
  type?: WalletTransactionsQuery["type"];
  search?: string;
}) {
  const query = walletTransactionsQuerySchema.parse({
    limit: input.limit,
    offset: (input.page - 1) * input.limit,
    type: input.type ?? "ALL",
    search: input.search ?? "",
  });

  const params = new URLSearchParams({
    limit: String(query.limit),
    offset: String(query.offset),
    type: query.type,
    search: query.search,
  });

  const response = await fetch(`/api/wallet/transactions?${params.toString()}`, {
    method: "GET",
    credentials: "same-origin",
  });

  const json = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(json, "Unable to load wallet transactions"));
  }

  return paginatedWalletTransactionsResponseSchema.parse(json);
}
