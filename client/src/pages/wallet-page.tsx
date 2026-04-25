import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { WalletBalanceActionDialog } from "../features/wallet/components/wallet-balance-action-dialog";
import { WalletHistoryItemCard } from "../features/wallet/components/wallet-history-item";
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

  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());
  const isUnverified = user?.isVerified === false;
  const walletActionsDisabled = isSuspended || isUnverified;

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

  const closeModal = (force = false) => {
    if (isSubmitting && !force) {
      return;
    }

    setActiveModal(null);
    setAmountInput("");
    setActionError(null);
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
        <div className="mt-4 grid gap-3">
          {wallet.history.length === 0 && <p className="text-sm text-slate-400">No wallet history yet.</p>}
          {wallet.history.map((item) => (
            <WalletHistoryItemCard
              key={item.id}
              item={item}
              formattedTimestamp={formatTimestamp(item.timestamp)}
            />
          ))}
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
