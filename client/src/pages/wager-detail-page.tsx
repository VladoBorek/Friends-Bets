import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import type { WagerDetail } from "../../../shared/src/schemas/wager";
import { WagerInlineBetMenu } from "../components/wager-inline-bet-menu";
import { WagerOutcomeItem } from "../components/wager-outcome-item";

interface WagerDetailPageProps {
  wagerId: number;
}
function formatMoney(value: string): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Request failed";
}

export function WagerDetailPage({ wagerId }: WagerDetailPageProps) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<WagerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openBetOutcomeId, setOpenBetOutcomeId] = useState<number | null>(null);
  const [resolutionOutcomeId, setResolutionOutcomeId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());
  const isUnverified = user?.isVerified === false;

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
  const canPlaceBet = detail.status === "OPEN" && !isSuspended && !isUnverified && !hasCurrentUserBet;
  const betDisabledMessage = detail.status !== "OPEN"
    ? "Betting is closed for this wager."
    : hasCurrentUserBet
      ? `You already placed a bet of ${formatMoney(detail.currentUserBetAmount ?? "0")} on ${detail.currentUserBetOutcomeTitle ?? "your selected outcome"}.`
      : isSuspended
        ? "Suspended users cannot place bets."
        : isUnverified
          ? "Account must be verified to perform this action."
        : "Betting is unavailable for this account.";

  const submitResolution = async () => {
    setMessage(null);
    setResolveError(null);

    if (detail.status === "CLOSED") {
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
          <span className="rounded-full border border-slate-700 px-2 py-1 transition-colors hover:border-slate-500 hover:bg-slate-800/35">{detail.status}</span>
          <span className="rounded-full border border-slate-700 px-2 py-1 transition-colors hover:border-slate-500 hover:bg-slate-800/35">Category: {detail.categoryName}</span>
          <span className="rounded-full border border-slate-700 px-2 py-1 transition-colors hover:border-slate-500 hover:bg-slate-800/35">Creator: {detail.creatorName}</span>
          <span className="rounded-full border border-cyan-400/50 bg-cyan-500/15 px-3 py-1 font-semibold text-cyan-100 transition-colors hover:border-cyan-300/70 hover:bg-cyan-500/25">
            Total pool: {formatMoney(detail.totalPool)}
          </span>
          {isSuspended && (
            <span className="rounded-full border border-amber-500/35 px-2 py-1 text-amber-200 transition-colors hover:border-amber-400/50 hover:bg-amber-500/10">
              Suspended
            </span>
          )}
          {isUnverified && (
            <span className="rounded-full border border-amber-500/35 px-2 py-1 text-amber-200 transition-colors hover:border-amber-400/50 hover:bg-amber-500/10">
              Unverified
            </span>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle>Outcomes</CardTitle>
        <div className="mt-4 grid gap-2">
          {detail.outcomes.map((outcome) => (
            <WagerOutcomeItem
              key={outcome.id}
              outcome={outcome}
              wagerStatus={detail.status}
              currentUserBetAmount={detail.currentUserBetAmount}
              currentUserBetOutcomeTitle={detail.currentUserBetOutcomeTitle}
              onClick={() => setOpenBetOutcomeId((current) => (current === outcome.id ? null : outcome.id))}
              isMenuOpen={openBetOutcomeId === outcome.id}
              menu={(
                <WagerInlineBetMenu
                  wagerId={detail.id}
                  outcomeId={outcome.id}
                  outcomeTitle={outcome.title}
                  canPlaceBet={canPlaceBet}
                  disabledMessage={betDisabledMessage}
                  onBetPlaced={async () => {
                    await refreshDetail();
                  }}
                />
              )}
            />
          ))}
        </div>
      </Card>

      {detail.status !== "CLOSED" && (
        <Card>
          <CardTitle>Temporary Resolve Shortcut</CardTitle>
          <CardDescription className="mt-2">
            Temporary UI control to close an open wager and pay out the winning side immediately.
          </CardDescription>
          <div className="mt-4 grid gap-3">
            <label className="flex flex-col gap-1 text-xs text-slate-300">
              Winning outcome
              <select
                value={resolutionOutcomeId?.toString() ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setResolutionOutcomeId(nextValue ? Number(nextValue) : null);
                }}
                className="rounded border border-slate-700 bg-slate-900 p-2 text-white"
              >
                <option value="" disabled>
                  Select an outcome
                </option>
                {detail.outcomes.map((outcome) => (
                  <option key={outcome.id} value={outcome.id.toString()}>
                    {outcome.title}
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="button"
              onClick={() => void submitResolution()}
              disabled={isResolving}
              variant="secondary"
              className="border border-amber-500/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15"
            >
              {isResolving ? "Resolving..." : "Resolve Wager"}
            </Button>
            {message && <p className="text-sm text-emerald-300">{message}</p>}
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