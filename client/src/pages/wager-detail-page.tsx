import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { Card, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import type { WagerDetail } from "../../../shared/src/schemas/wager";
import { WagerInlineBetMenu } from "../components/wager-inline-bet-menu";
import { WagerOutcomeItem } from "../components/wager-outcome-item";

interface WagerDetailPageProps {
  wagerId: number;
}

function formatMoney(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : value;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Request failed";
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "OPEN"
      ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-200"
      : status === "PENDING"
        ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
        : "border-slate-600 bg-slate-800/50 text-slate-400";
  const label = status === "OPEN" ? "Open" : status === "PENDING" ? "Pending" : "Closed";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}>{label}</span>
  );
}

export function WagerDetailPage({ wagerId }: WagerDetailPageProps) {
  const navigate = useNavigate();
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
  const isCreator = detail ? detail.createdById === user?.id : false;

  useEffect(() => {
    const controller = new AbortController();
    async function loadDetail() {
      try {
        const response = await fetch(`/api/wagers/${wagerId}`, { signal: controller.signal });
        const json = (await response.json().catch(() => null)) as { data?: WagerDetail; message?: string } | null;
        if (!response.ok) throw new Error(json?.message ?? "Wager not found");
        const next = json?.data ?? null;
        setDetail(next);
        setResolutionOutcomeId((cur) => cur ?? next?.outcomes[0]?.id ?? null);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setPageError(e instanceof Error ? e.message : "Wager not found");
      } finally { setIsLoading(false); }
    }
    setIsLoading(true);
    void loadDetail();
    return () => controller.abort();
  }, [wagerId]);

  const refreshDetail = async () => {
    const response = await fetch(`/api/wagers/${wagerId}`);
    const json = (await response.json().catch(() => null)) as { data?: WagerDetail; message?: string } | null;
    if (!response.ok) throw new Error(json?.message ?? "Unable to refresh wager");
    const next = json?.data ?? null;
    setDetail(next);
    setResolutionOutcomeId(next?.outcomes[0]?.id ?? null);
  };

  if (isLoading) return <p className="text-slate-300">Loading wager…</p>;
  if (pageError || !detail) return <p className="text-rose-300">{pageError ?? "Wager not found."}</p>;

  const currentUserBetAmount = Number(detail.currentUserBetAmount ?? "0");
  const hasCurrentUserBet = currentUserBetAmount > 0;
  const canPlaceBet = detail.status === "OPEN" && !isSuspended && !isUnverified && !hasCurrentUserBet;
  const betDisabledMessage =
    detail.status !== "OPEN"
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
    if (!resolutionOutcomeId) { setResolveError("Please select a winning outcome"); return; }
    setIsResolving(true);
    try {
      const response = await fetch(`/api/wagers/${detail.id}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeId: resolutionOutcomeId }),
      });
      const json = (await response.json().catch(() => null)) as { data?: WagerDetail; message?: string } | null;
      if (!response.ok) throw new Error(json?.message ?? "Failed to resolve wager");
      setMessage("Wager resolved — payouts processed.");
      setDetail(json?.data ?? detail);
      await refreshDetail();
    } catch (e) {
      setResolveError(toErrorMessage(e));
    } finally { setIsResolving(false); }
  };

  return (
    <div className="grid gap-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button
          type="button"
          onClick={() => void navigate({ to: "/wagers" })}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors"
        >
          ← Back
        </button>
        <span className="text-slate-600">/</span>
        <Link to="/wagers" className="hover:text-slate-200 transition-colors">Wagers</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300 truncate max-w-xs">{detail.title}</span>
      </div>

      {/* Main info card */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-2xl">{detail.title}</CardTitle>
          <StatusBadge status={detail.status} />
        </div>

        {detail.description && (
          <p className="mt-2 text-slate-300">{detail.description}</p>
        )}

        {/* Total pool — prominent */}
        <div className="mt-5 inline-flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total pool</span>
          <span className="text-3xl font-bold text-cyan-300">{formatMoney(detail.totalPool)}</span>
        </div>

        {/* Secondary metadata */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>Category: <span className="text-slate-400">{detail.categoryName}</span></span>
          <span>Created by: <span className="text-slate-400">{detail.creatorName}</span></span>
          {detail.createdAt && (
            <span>Date: <span className="text-slate-400">{new Date(detail.createdAt).toLocaleDateString()}</span></span>
          )}
        </div>

        {/* Account notices */}
        {(isSuspended || isUnverified) && (
          <div className="mt-3 flex gap-2">
            {isSuspended && <span className="rounded-full border border-amber-500/35 px-2 py-0.5 text-xs text-amber-200">Suspended</span>}
            {isUnverified && <span className="rounded-full border border-amber-500/35 px-2 py-0.5 text-xs text-amber-200">Unverified</span>}
          </div>
        )}
      </Card>

      {/* Outcomes */}
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
              onClick={() => setOpenBetOutcomeId((cur) => cur === outcome.id ? null : outcome.id)}
              isMenuOpen={openBetOutcomeId === outcome.id}
              menu={(
                <WagerInlineBetMenu
                  wagerId={detail.id}
                  outcomeId={outcome.id}
                  outcomeTitle={outcome.title}
                  canPlaceBet={canPlaceBet}
                  disabledMessage={betDisabledMessage}
                  onBetPlaced={refreshDetail}
                />
              )}
            />
          ))}
        </div>
      </Card>

      {/* Resolve — creator only, not yet closed */}
      {isCreator && detail.status !== "CLOSED" && (
        <Card>
          <CardTitle>Resolve Wager</CardTitle>
          <p className="mt-1 text-sm text-slate-400">Select the winning outcome to close betting and distribute payouts.</p>
          <div className="mt-4 grid gap-3">
            <label className="flex flex-col gap-1 text-xs text-slate-300">
              Winning outcome
              <select
                value={resolutionOutcomeId?.toString() ?? ""}
                onChange={(e) => setResolutionOutcomeId(e.target.value ? Number(e.target.value) : null)}
                className="rounded border border-slate-700 bg-slate-900 p-2 text-white"
              >
                <option value="" disabled>Select an outcome</option>
                {detail.outcomes.map((o) => (
                  <option key={o.id} value={o.id.toString()}>{o.title}</option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              onClick={() => void submitResolution()}
              disabled={isResolving}
              variant="secondary"
              className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
            >
              {isResolving ? "Resolving…" : "Resolve Wager"}
            </Button>
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {resolveError && <p className="text-sm text-rose-300">{resolveError}</p>}
          </div>
        </Card>
      )}
    </div>
  );
}
