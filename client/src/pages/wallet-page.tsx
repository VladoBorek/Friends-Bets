import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { FriendsPagination } from "../components/ui/friends/friends-pagination";
import { WalletBalanceActionDialog } from "../features/wallet/components/wallet-balance-action-dialog";
import { WalletTransactionFilters } from "../features/wallet/components/wallet-transaction-filters";
import { WalletHistoryItemCard } from "../features/wallet/components/wallet-history-item";
import {
  filterWalletTransactions,
  WALLET_TRANSACTION_PAGE_SIZE,
  type WalletTransactionTypeFilter,
} from "../features/wallet/wallet-transactions";
import { validateWalletCreditInput } from "../features/wagers/utils";
import { useAuth } from "../lib/auth-context";
import type { WalletHistoryItem, WalletOverview } from "../../../shared/src/schemas/wallet";

function formatMoney(value: string): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}

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
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"deposit" | "withdraw" | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<WalletTransactionTypeFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());
  const isUnverified = user?.isVerified === false;
  const walletActionsDisabled = isSuspended || isUnverified;

  const filteredTransactions = useMemo(() => {
    if (!wallet) {
      return [];
    }

    return filterWalletTransactions(wallet.history, transactionSearch, transactionTypeFilter);
  }, [transactionSearch, transactionTypeFilter, wallet]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / WALLET_TRANSACTION_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * WALLET_TRANSACTION_PAGE_SIZE;
    return filteredTransactions.slice(startIndex, startIndex + WALLET_TRANSACTION_PAGE_SIZE);
  }, [filteredTransactions, safeCurrentPage]);

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
    setTransactionSearch(value);
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (value: WalletTransactionTypeFilter) => {
    setTransactionTypeFilter(value);
    setCurrentPage(1);
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
    setCurrentPage(page);
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

      const json = (await response.json().catch(() => null)) as {
        data?: { balance?: string; transaction?: WalletHistoryItem };
      } | null;

      setWallet((current) =>
        current
          ? {
              ...current,
              balance: json?.data?.balance ?? current.balance,
              history: json?.data?.transaction ? [json.data.transaction, ...current.history] : current.history,
            }
          : current,
      );

      closeModal(true);
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : "Unable to update wallet balance");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadWallet() {
      try {
        const response = await fetch("/api/wallet/me", { signal: controller.signal });

        if (!response.ok) {
          throw new Error(await extractErrorMessage(response, "Unable to load wallet"));
        }

        const json = (await response.json().catch(() => null)) as { data?: WalletOverview } | null;

        setWallet(json?.data ?? null);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load wallet");
      } finally {
        setIsLoading(false);
      }
    }

    void loadWallet();
    return () => controller.abort();
  }, []);

  if (isLoading) {
    return <p className="text-slate-300">Loading wallet...</p>;
  }

  if (error) {
    return <p className="text-rose-300">{error}</p>;
  }

  if (!wallet) {
    return <p className="text-slate-300">Wallet not found.</p>;
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardTitle>Wallet</CardTitle>
        <CardDescription className="mt-2">
          Current balance and wager history affecting the active account.
        </CardDescription>
        <div className="mt-4 text-3xl font-semibold text-cyan-200">{formatMoney(wallet.balance)}</div>
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
            search={transactionSearch}
            typeFilter={transactionTypeFilter}
            onSearchChange={handleSearchChange}
            onTypeFilterChange={handleTypeFilterChange}
          />

          <div className="grid gap-3">
            {filteredTransactions.length === 0 ? (
              <p className="text-sm text-slate-400">No wallet transactions match the current filters.</p>
            ) : (
              paginatedTransactions.map((item) => (
                <WalletHistoryItemCard
                  key={item.id}
                  item={item}
                  formattedTimestamp={formatTimestamp(item.timestamp)}
                />
              ))
            )}
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="grid gap-3 pt-1">
              <div className="text-center text-xs text-slate-500">
                Showing {Math.min((safeCurrentPage - 1) * WALLET_TRANSACTION_PAGE_SIZE + 1, filteredTransactions.length)}-
                {Math.min(safeCurrentPage * WALLET_TRANSACTION_PAGE_SIZE, filteredTransactions.length)} of {filteredTransactions.length}
              </div>
              <FriendsPagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          ) : null}
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
