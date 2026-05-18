import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "../../components/ui/utils/button";
import { Card, CardDescription, CardTitle } from "../../components/ui/utils/card";
import { FriendsPagination } from "../../components/ui/friends/friends-pagination";
import { WalletBalanceActionDialog } from "../../features/wallet/components/wallet-balance-action-dialog";
import { WalletTransactionFilters } from "../../features/wallet/components/wallet-transaction-filters";
import { WalletHistoryItemCard } from "../../features/wallet/components/wallet-history-item";
import { WALLET_TRANSACTION_PAGE_SIZE, type WalletTransactionTypeFilter } from "../../features/wallet/wallet-transactions";
import { formatCurrency, validateWalletCreditInput } from "../../features/wagers/utils";
import { useAuth } from "../../lib/auth-context";
import {
  publishWalletBalanceRefresh,
  useWalletOverview,
  walletKeys,
} from "../../api/wallet/wallet-query-options";
import { fetchWalletTransactions } from "../../api/wallet/wallet-api";
import { Route } from "../../routes/wallet";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import type {
  WalletHistoryItem,
  WalletOverview,
  WalletTransactionsQuery,
} from "@pb138/shared/schemas/wallet";
import { walletBalanceMutationResponseSchema } from "@pb138/shared/schemas/wallet";

type WalletBalanceMutationResponse = z.infer<typeof walletBalanceMutationResponseSchema>;

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

async function extractErrorMessage(response: Response, fallback: string): Promise<string> {
  const rawBody = (await response.text().catch(() => "")).trim();
  if (!rawBody) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawBody) as { message?: string };
    if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
      return parsed.message;
    }
  } catch {
    return rawBody;
  }

  return rawBody;
}

export function WalletPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<"deposit" | "withdraw" | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const walletQuery = useWalletOverview(user?.id);
  const wallet = walletQuery.data?.data ?? null;

  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());
  const isUnverified = user?.isVerified === false;
  const walletActionsDisabled = isSuspended || isUnverified;

  // Fetch paginated transactions
  const [searchInput, setSearchInput] = useState(() => (typeof search.search === "string" ? search.search : ""));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transactionsQuery = useQuery({
    queryKey: walletKeys.transactions(search.page, search.type, search.search),
    queryFn: () =>
      fetchWalletTransactions({
        page: search.page,
        limit: WALLET_TRANSACTION_PAGE_SIZE,
        type: (search.type as unknown) as WalletTransactionsQuery["type"],
        search: typeof search.search === "string" ? search.search : undefined,
      }),
    staleTime: 30_000,
  });

  const lastTransactionsRef = useRef<WalletHistoryItem[] | null>(null);
  const lastPaginationRef = useRef<{ total: number; limit: number; offset: number; hasMore: boolean } | null>(
    null,
  );

  if (transactionsQuery.data) {
    lastTransactionsRef.current = transactionsQuery.data.data;
    lastPaginationRef.current = transactionsQuery.data.pagination;
  }

  const visibleTransactions = (transactionsQuery.data?.data ?? lastTransactionsRef.current ?? []) as WalletHistoryItem[];
  const visiblePagination = transactionsQuery.data?.pagination ?? lastPaginationRef.current;

  const totalPages = visiblePagination ? Math.ceil(visiblePagination.total / visiblePagination.limit) : 1;
  const safeCurrentPage = Math.min(search.page, totalPages);

  const getAmountValidationMessage = (): string | null => {
    const amountValidationMessage = validateWalletCreditInput(amountInput);
    if (amountValidationMessage) return amountValidationMessage;

    const amount = Number(amountInput);

    if (activeModal === "withdraw" && wallet && amount > Number(wallet.balance)) {
      return "Withdraw amount exceeds current balance";
    }

    return null;
  };

  const openModal = (mode: "deposit" | "withdraw") => {
    setActiveModal(mode);
    setAmountInput("");
    setActionError(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void navigate({
        to: "/wallet",
        search: { page: 1, type: search.type, search: value },
        resetScroll: false,
      });
    }, 300);
  };

  const handleTypeFilterChange = (value: WalletTransactionTypeFilter) => {
    void navigate({
      to: "/wallet",
      search: { page: 1, type: value, search: search.search },
      resetScroll: false,
    });
  };

  const closeModal = (force = false) => {
    if (isSubmitting && !force) {
      return;
    }

    setActiveModal(null);
    setAmountInput("");
    setActionError(null);
  };

  const handlePageChange = (page: number) => {
    void navigate({
      to: "/wallet",
      search: { page, type: search.type, search: search.search },
    });
  };

  const submitWalletAction = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!wallet || !activeModal) {
      return;
    }

    const validationMessage = getAmountValidationMessage();
    if (validationMessage) {
      setActionError(validationMessage);
      return;
    }

    const amount = Number(amountInput);
    setIsSubmitting(true);
    setActionError(null);

    try {
      const response = await fetch(`/api/wallet/${activeModal}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response, "Unable to update wallet balance"));
      }

      const json = (await response.json().catch(() => null)) as WalletBalanceMutationResponse | null;
      const nextBalance = json?.data?.balance;
      const nextTransaction = json?.data?.transaction;

      if (user?.id && nextBalance) {
        queryClient.setQueryData(walletKeys.overview(user.id), (current: { data: WalletOverview } | undefined) => {
          const currentData = current?.data;

          if (!currentData) {
            return {
              data: {
                balance: nextBalance,
                history: nextTransaction ? [nextTransaction] : [],
              },
            };
          }

          return {
            data: {
              ...currentData,
              balance: nextBalance,
              history: nextTransaction ? [nextTransaction, ...currentData.history] : currentData.history,
            },
          };
        });

        publishWalletBalanceRefresh(user.id);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: walletKeys.all }),
        transactionsQuery.refetch(),
      ]);

      closeModal(true);
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Unable to update wallet balance");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (walletQuery.isLoading) {
    return <p className="text-slate-300">Loading wallet...</p>;
  }

  if (walletQuery.error) {
    return <p className="text-rose-300">{walletQuery.error instanceof Error ? walletQuery.error.message : "Unable to load wallet"}</p>;
  }

  if (!wallet) {
    return <p className="text-slate-300">Wallet not found.</p>;
  }

  // Do not block rendering the entire page while transactions load.
  // Transactions-specific loading/error states are handled inside the History card below.

  return (
    <div className="grid gap-4">
      <Card>
        <CardTitle>Wallet</CardTitle>
        <CardDescription className="mt-2">
          Current balance and wager history affecting the active account.
        </CardDescription>
        <div className="mt-4 text-3xl font-semibold text-cyan-200">{formatCurrency(wallet.balance)}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => openModal("deposit")} disabled={walletActionsDisabled}>
            Deposit
          </Button>
          <Button variant="secondary" onClick={() => openModal("withdraw")} disabled={walletActionsDisabled}>
            Withdraw
          </Button>
        </div>
        {walletActionsDisabled && (
          <p className="mt-2 text-sm text-amber-300">
            {isSuspended
              ? "Suspended users cannot perform wallet actions."
              : "Account must be verified to perform wallet actions."}
          </p>
        )}
      </Card>

      <Card>
        <CardTitle>History</CardTitle>
        <div className="mt-4 grid gap-4">
          <WalletTransactionFilters
            search={searchInput}
            typeFilter={search.type as WalletTransactionTypeFilter}
            onSearchChange={handleSearchChange}
            onTypeFilterChange={handleTypeFilterChange}
          />

          <div className="grid gap-3">
            {visibleTransactions.length === 0 ? (
              <p className="text-sm text-slate-400">No wallet transactions match the current filters.</p>
            ) : (
              visibleTransactions.map((item) => (
                <WalletHistoryItemCard
                  key={item.id}
                  item={item}
                  formattedTimestamp={formatTimestamp(item.timestamp)}
                />
              ))
            )}
          </div>
          <div className="relative">
            {visibleTransactions.length > 0 && visiblePagination ? (
              <div className="grid gap-3 pt-1">
                <div className="text-center text-xs text-slate-500">
                  Showing {Math.min((safeCurrentPage - 1) * WALLET_TRANSACTION_PAGE_SIZE + 1, visiblePagination.total)}-
                  {Math.min(safeCurrentPage * WALLET_TRANSACTION_PAGE_SIZE, visiblePagination.total)} of {visiblePagination.total}
                </div>
                <FriendsPagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            ) : null}

            {transactionsQuery.isFetching && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-200" />
              </div>
            )}
          </div>
        </div>
      </Card>

      <WalletBalanceActionDialog
        open={activeModal !== null}
        mode={activeModal}
        balance={wallet.balance}
        amountInput={amountInput}
        isSubmitting={isSubmitting}
        errorMessage={actionError}
        validationMessage={getAmountValidationMessage()}
        onOpenChange={(open) => {
          if (!open) {
            closeModal();
          }
        }}
        onAmountChange={(value) => {
          setAmountInput(value);
          setActionError(null);
        }}
        onSubmit={submitWalletAction}
        onCancel={() => closeModal()}
      />
    </div>
  );
}
