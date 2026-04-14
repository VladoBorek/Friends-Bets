import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { useAuth } from "../lib/auth-context";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import type { WagerDetail } from "../../../shared/src/schemas/wager";

interface WagerDetailPageProps {
  wagerId: number;
}

const BET_AMOUNT_ERROR_MESSAGE = "Bet amount must be greater than 0.";

function formatMoney(value: string): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}

function toErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const value = error as {
      response?: { data?: unknown };
      message?: unknown;
    };

    if (typeof value.response?.data === "string" && value.response.data.trim()) {
      return value.response.data;
    }

    if (value.response?.data && typeof value.response.data === "object") {
      const data = value.response.data as {
        message?: unknown;
        issues?: Array<{ message?: unknown }>;
      };
      const firstIssueMessage = data.issues?.find((issue) => typeof issue.message === "string")?.message;
      if (typeof firstIssueMessage === "string" && firstIssueMessage.trim()) {
        return firstIssueMessage;
      }

      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
    }

    if (typeof value.message === "string" && value.message.trim()) {
      return value.message;
    }
  }

  return "Request failed";
}

function validateBetAmount(value: string): string | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return BET_AMOUNT_ERROR_MESSAGE;
  }

  const amount = Number(trimmedValue);
  if (!Number.isFinite(amount) || amount < 0.01) {
    return BET_AMOUNT_ERROR_MESSAGE;
  }

  if (!Number.isInteger(amount * 100)) {
    return BET_AMOUNT_ERROR_MESSAGE;
  }

  return null;
}



export function WagerDetailPage({ wagerId }: WagerDetailPageProps) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<WagerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<number | null>(null);
  const [resolutionOutcomeId, setResolutionOutcomeId] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [betError, setBetError] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());

  useEffect(() => {
    const controller = new AbortController();

    async function loadDetail() {
      try {
        const response = await fetch(`/api/wagers/${wagerId}`, { signal: controller.signal });
        const json = (await response.json().catch(() => null)) as { data?: WagerDetail; message?: string } | null;

        if (!response.ok) {
          throw new Error(json?.message ?? "Wager not found");
        }

        const nextDetail = json?.data ?? null;
        setDetail(nextDetail);
        setSelectedOutcomeId((current) => current ?? nextDetail?.outcomes[0]?.id ?? null);
        setResolutionOutcomeId((current) => current ?? nextDetail?.outcomes[0]?.id ?? null);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setPageError(loadError instanceof Error ? loadError.message : "Wager not found");
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    void loadDetail();

    return () => controller.abort();
  }, [wagerId]);

  const refreshDetail = async () => {
    const response = await fetch(`/api/wagers/${wagerId}`);
    const json = (await response.json().catch(() => null)) as { data?: WagerDetail; message?: string } | null;
    if (!response.ok) {
      throw new Error(json?.message ?? "Unable to refresh wager");
    }

    const nextDetail = json?.data ?? null;
    setDetail(nextDetail);
    setSelectedOutcomeId(nextDetail?.outcomes[0]?.id ?? null);
    setResolutionOutcomeId(nextDetail?.outcomes[0]?.id ?? null);
  };

  if (isLoading) {
    return <p className="text-slate-300">Loading wager detail...</p>;
  }

  if (pageError || !detail) {
    return <p className="text-rose-300">{pageError ?? "Wager not found."}</p>;
  }

  const currentUserBetAmount = Number(detail.currentUserBetAmount ?? "0");
  const hasCurrentUserBet = currentUserBetAmount > 0;
  const canPlaceBet = detail.status === "OPEN" && !isSuspended && !hasCurrentUserBet;

  const submitBet = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setBetError(null);

    if (isSuspended) {
      setBetError("Suspended users cannot place bets.");
      return;
    }

    if (hasCurrentUserBet) {
      setBetError("You have already placed a bet on this wager.");
      return;
    }

    if (!selectedOutcomeId) {
      setBetError("Please select an outcome");
      return;
    }

    const validationMessage = validateBetAmount(betAmount);
    if (validationMessage) {
      setBetError(validationMessage);
      return;
    }

    const amount = Number(betAmount);

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/wagers/${detail.id}/bets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeId: selectedOutcomeId, amount }),
      });
      const json = (await response.json().catch(() => ({}))) as { data?: { id?: number }; message?: string } | null;

      if (!response.ok) {
        console.log({ response, json });
        throw new Error(json?.message ?? "Failed to place bet");
      }

      setMessage(json?.data?.id ? `Bet placed successfully (id ${json.data.id})` : "Bet placed successfully");
      setBetAmount("");
      await refreshDetail();
    } catch (submitError) {
      setBetError(toErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitResolution = async () => {
    setMessage(null);
    setResolveError(null);

    if (detail.status !== "OPEN") {
      setResolveError("This wager is already closed.");
      return;
    }

    if (!resolutionOutcomeId) {
      setResolveError("Please select a winning outcome");
      return;
    }

    setIsResolving(true);
    try {
      // TEMPORARY: this lets any authenticated user resolve a wager while the admin workflow is unfinished.
      const response = await fetch(`/api/wagers/${detail.id}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeId: resolutionOutcomeId }),
      });
      const json = (await response.json().catch(() => null)) as { data?: WagerDetail; message?: string } | null;

      if (!response.ok) {
        throw new Error(json?.message ?? "Failed to resolve wager");
      }

      setMessage("Wager resolved and payouts were processed.");
      setDetail(json?.data ?? detail);
      await refreshDetail();
    } catch (resolveError) {
      setResolveError(toErrorMessage(resolveError));
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardTitle>{detail.title}</CardTitle>
        <CardDescription className="mt-2">{detail.description ?? "No description"}</CardDescription>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
          <span className="rounded-full border border-slate-700 px-2 py-1">{detail.status}</span>
          <span>Category: {detail.categoryName}</span>
          <span>Creator: {detail.creatorName}</span>
          <span>Total pool: {formatMoney(detail.totalPool)}</span>
          {hasCurrentUserBet && (
            <span className="rounded-full border border-emerald-500/40 px-2 py-1 text-emerald-300">
              Your bet: {formatMoney(detail.currentUserBetAmount ?? "0")}
            </span>
          )}
          {detail.currentUserBetOutcomeTitle && (
            <span className="rounded-full border border-emerald-500/40 px-2 py-1 text-emerald-300">
              Selected outcome: {detail.currentUserBetOutcomeTitle}
            </span>
          )}
          {isSuspended && <span className="rounded-full border border-amber-500/35 px-2 py-1 text-amber-200">Suspended</span>}
        </div>
      </Card>

      <Card>
        <CardTitle>Outcomes</CardTitle>
        <div className="mt-4 grid gap-2">
          {detail.outcomes.map((outcome) => (
            <div key={outcome.id} className="rounded-md border border-slate-700 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-100">{outcome.title}</p>
                <p className="text-sm text-cyan-300">{outcome.odds ? `${outcome.odds}x` : "n/a"}</p>
              </div>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                <span>Volume: {formatMoney(outcome.totalBet)}</span>
                {detail.status === "CLOSED" && outcome.isWinner && <span className="text-emerald-300">Winning outcome</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {canPlaceBet ? (
        <Card>
          <CardTitle>Place a bet</CardTitle>
          <form className="mt-4 grid gap-3" onSubmit={submitBet} noValidate>
          <label className="flex flex-col gap-1 text-xs text-slate-300">
            Outcome
            <select
              value={selectedOutcomeId ?? ""}
              onChange={(event) => setSelectedOutcomeId(Number(event.target.value))}
              className="rounded border border-slate-700 bg-slate-900 p-2 text-white"
            >
              {detail.outcomes.map((outcome) => (
                <option key={outcome.id} value={outcome.id}>
                  {outcome.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs text-slate-300">
            Amount
            <input
              value={betAmount}
              onChange={(event) => {
                const nextValue = event.target.value;
                setBetAmount(nextValue);
                if (!nextValue.trim()) {
                  setBetError(null);
                  return;
                }

                setBetError(validateBetAmount(nextValue));
              }}
              type="text"
              inputMode="decimal"
              className="rounded border border-slate-700 bg-slate-900 p-2 text-white"
            />
          </label>

          {message && <p className="text-emerald-300">{message}</p>}
          {betError && <p className="text-rose-300">{betError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            {isSubmitting ? "Placing bet..." : "Place Bet"}
          </button>
          </form>
        </Card>
      ) : (
        <Card>
          <CardTitle>Betting</CardTitle>
          <CardDescription className="mt-2">
            {detail.status !== "OPEN"
              ? "Betting is closed for this wager."
              : hasCurrentUserBet
                ? `You already placed a bet of ${formatMoney(detail.currentUserBetAmount ?? "0")} on ${detail.currentUserBetOutcomeTitle ?? "your selected outcome"}.`
                : "Betting is unavailable for this account."}
          </CardDescription>
        </Card>
      )}

      {detail.status === "OPEN" && (
        <Card>
          <CardTitle>Temporary Resolve Shortcut</CardTitle>
          <CardDescription className="mt-2">
            Temporary UI control to close an open wager and pay out the winning side immediately.
          </CardDescription>
          <div className="mt-4 grid gap-3">
            <label className="flex flex-col gap-1 text-xs text-slate-300">
              Winning outcome
              <select
                value={resolutionOutcomeId ?? ""}
                onChange={(event) => setResolutionOutcomeId(Number(event.target.value))}
                className="rounded border border-slate-700 bg-slate-900 p-2 text-white"
              >
                {detail.outcomes.map((outcome) => (
                  <option key={outcome.id} value={outcome.id}>
                    {outcome.title}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => void submitResolution()}
              disabled={isResolving}
              className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/15 disabled:opacity-60"
            >
              {isResolving ? "Resolving..." : "Resolve Wager"}
            </button>
            {resolveError && <p className="text-sm text-rose-300">{resolveError}</p>}
          </div>
        </Card>
      )}

      <Link to="/wagers" className="text-sm text-cyan-300 transition-colors hover:text-cyan-200">
        Back to list
      </Link>
    </div>
  );
}
