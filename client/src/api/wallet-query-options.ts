import { useEffect } from "react";
import { queryOptions, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { WalletOverview, WalletTransactionsQuery } from "@pb138/shared/schemas/wallet";
import { WALLET_TRANSACTION_PAGE_SIZE } from "../features/wallet/wallet-transactions";
import { fetchWalletOverview, fetchWalletTransactions } from "./wallet-api";

export const WALLET_TRANSACTION_PAGE_SIZE_CONST = 10;

export const walletKeys = {
  all: ["wallet"] as const,
  overview: (userId?: number) => ["wallet", "overview", userId ?? "anonymous"] as const,
  transactions: (page: number, type?: string, search?: string) =>
    ["wallet", "transactions", page, type ?? "ALL", search ?? ""] as const,
};

export const walletQueries = {
  overview: (userId?: number) =>
    queryOptions({
      queryKey: walletKeys.overview(userId),
      queryFn: fetchWalletOverview,
      staleTime: 30_000,
    }),

  transactions: (page: number, type?: WalletTransactionsQuery["type"], search?: string) =>
    queryOptions({
      queryKey: walletKeys.transactions(page, type, search),
      queryFn: () =>
        fetchWalletTransactions({
          page,
          limit: WALLET_TRANSACTION_PAGE_SIZE,
          type,
          search,
        }),
      staleTime: 30_000,
    }),
};

export type WalletOverviewResponse = {
  data: WalletOverview;
};

type WalletSyncEvent =
  | { userId: number; type: "delta"; delta: number }
  | { userId: number; type: "refresh" };

const WALLET_SYNC_CHANNEL = "pb138-wallet-sync";
const WALLET_SYNC_STORAGE_KEY = "pb138.wallet.sync";

let walletSyncChannel: BroadcastChannel | null = null;

function getWalletSyncChannel() {
  if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") {
    return null;
  }

  if (!walletSyncChannel) {
    walletSyncChannel = new BroadcastChannel(WALLET_SYNC_CHANNEL);
  }

  return walletSyncChannel;
}

function isWalletSyncEvent(value: unknown): value is WalletSyncEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WalletSyncEvent>;
  if (typeof candidate.userId !== "number" || !Number.isFinite(candidate.userId)) {
    return false;
  }

  if (candidate.type === "refresh") {
    return true;
  }

  return candidate.type === "delta" && typeof candidate.delta === "number" && Number.isFinite(candidate.delta);
}

function publishWalletSyncEvent(event: WalletSyncEvent) {
  try {
    const channel = getWalletSyncChannel();
    if (channel) {
      channel.postMessage(event);
      return;
    }
  } catch (error) {
    console.error("[wallet-sync] Failed to publish BroadcastChannel event", error);
  }

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(WALLET_SYNC_STORAGE_KEY, JSON.stringify({ event, timestamp: Date.now() }));
    window.localStorage.removeItem(WALLET_SYNC_STORAGE_KEY);
  } catch (error) {
    console.error("[wallet-sync] Failed to publish storage event", error);
  }
}

export function publishWalletBalanceDelta(userId: number, delta: number) {
  publishWalletSyncEvent({ userId, type: "delta", delta });
}

export function publishWalletBalanceRefresh(userId: number) {
  publishWalletSyncEvent({ userId, type: "refresh" });
}

export function useWalletOverview(userId?: number) {
  return useQuery({
    ...walletQueries.overview(userId),
    enabled: typeof userId === "number",
  });
}

export function updateWalletOverviewBalance(
  queryClient: QueryClient,
  userId: number,
  updater: (currentBalance: string) => string,
) {
  const current = queryClient.getQueryData<WalletOverviewResponse>(walletKeys.overview(userId));

  if (!current?.data) {
    return false;
  }

  queryClient.setQueryData<WalletOverviewResponse>(walletKeys.overview(userId), {
    data: {
      ...current.data,
      balance: updater(current.data.balance),
    },
  });

  return true;
}

export function applyWalletBalanceDelta(queryClient: QueryClient, userId: number, delta: number) {
  if (!Number.isFinite(delta)) {
    console.error("[wallet-sync] Refusing to apply invalid wallet delta", delta);
    return false;
  }

  return updateWalletOverviewBalance(queryClient, userId, (currentBalance) => {
    const nextBalance = Math.max(0, Number(currentBalance) + delta);
    return Number.isFinite(nextBalance) ? nextBalance.toFixed(2) : currentBalance;
  });
}

export function refreshWalletOverview(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: walletKeys.all });
}

export function useWalletOverviewRealtimeSync(userId?: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof userId !== "number") {
      return () => undefined;
    }

    const channel = getWalletSyncChannel();

    const handleEvent = (event: WalletSyncEvent) => {
      if (event.userId !== userId) {
        return;
      }

      if (event.type === "delta") {
        const updated = applyWalletBalanceDelta(queryClient, userId, event.delta);
        if (!updated) {
          void refreshWalletOverview(queryClient).catch((error: unknown) => {
            console.error("[wallet-sync] Failed to refresh wallet balance after delta", error);
          });
        }
        return;
      }

      void refreshWalletOverview(queryClient).catch((error: unknown) => {
        console.error("[wallet-sync] Failed to refresh wallet balance", error);
      });
    };

    const onBroadcastMessage = (messageEvent: MessageEvent<unknown>) => {
      if (isWalletSyncEvent(messageEvent.data)) {
        handleEvent(messageEvent.data);
      }
    };

    const onStorage = (storageEvent: StorageEvent) => {
      if (storageEvent.key !== WALLET_SYNC_STORAGE_KEY || !storageEvent.newValue) {
        return;
      }

      try {
        const parsed = JSON.parse(storageEvent.newValue) as { event?: unknown };
        if (isWalletSyncEvent(parsed.event)) {
          handleEvent(parsed.event);
        }
      } catch (error) {
        console.error("[wallet-sync] Failed to parse wallet sync event", error);
      }
    };

    if (channel) {
      channel.addEventListener("message", onBroadcastMessage as EventListener);
      return () => {
        channel.removeEventListener("message", onBroadcastMessage as EventListener);
      };
    }

    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [queryClient, userId]);
}
