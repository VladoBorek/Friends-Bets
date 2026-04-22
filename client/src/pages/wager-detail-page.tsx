import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { WagerDetail } from "../../../shared/src/schemas/wager";
import { Card, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BetsSection } from "../features/wagers/components/bets-section";
import { CommentSection } from "../features/wagers/components/comment-section";
import { EndBettingModal } from "../features/wagers/components/end-betting-modal";
import { PoolBar } from "../features/wagers/components/pool-bar";
import { ResolveWagerModal } from "../features/wagers/components/resolve-wager-modal";
import { StatusBadge } from "../features/wagers/components/status-badge";
import { WagerInlineBetMenu } from "../features/wagers/components/wager-inline-bet-menu";
import { WagerOutcomeItem } from "../features/wagers/components/wager-outcome-item";
import { formatMoney, toErrorMessage } from "../features/wagers/utils";
import { useAuth } from "../lib/auth-context";

interface WagerDetailPageProps {
  wagerId: number;
}

export function WagerDetailPage({ wagerId }: WagerDetailPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [detail, setDetail] = useState<WagerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openBetOutcomeId, setOpenBetOutcomeId] = useState<number | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [showEndBettingModal, setShowEndBettingModal] = useState(false);
  const [endBettingError, setEndBettingError] = useState<string | null>(null);
  const [isEndingBetting, setIsEndingBetting] = useState(false);

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [betsRefreshKey, setBetsRefreshKey] = useState(0);

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
        setDetail(json?.data ?? null);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setPageError(e instanceof Error ? e.message : "Wager not found");
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
    if (!response.ok) throw new Error(json?.message ?? "Unable to refresh wager");
    setDetail(json?.data ?? null);
    setBetsRefreshKey((k) => k + 1);
  };

  const handleEndBetting = async () => {
    setEndBettingError(null);
    setIsEndingBetting(true);
    try {
      const response = await fetch(`/api/wagers/${wagerId}/close`, { method: "PATCH" });
      const json = (await response.json().catch(() => null)) as { data?: WagerDetail; message?: string } | null;
      if (!response.ok) throw new Error(json?.message ?? "Failed to end betting");
      setDetail(json?.data ?? detail);
      setShowEndBettingModal(false);
      setActionSuccess("Betting period ended — wager is now Pending.");
    } catch (e) {
      setEndBettingError(toErrorMessage(e));
    } finally {
      setIsEndingBetting(false);
    }
  };

  const handleResolve = async (outcomeId: number) => {
    setResolveError(null);
    setIsResolving(true);
    try {
      const response = await fetch(`/api/wagers/${detail!.id}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeId }),
      });
      const json = (await response.json().catch(() => null)) as { data?: WagerDetail; message?: string } | null;
      if (!response.ok) throw new Error(json?.message ?? "Failed to resolve wager");
      setShowResolveModal(false);
      setActionSuccess("Wager resolved — payouts processed.");
      await refreshDetail();
    } catch (e) {
      setResolveError(toErrorMessage(e));
    } finally {
      setIsResolving(false);
    }
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

  const canEndBetting = isCreator && detail.status === "OPEN";
  const canResolve = isCreator && detail.status !== "CLOSED";

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button
          type="button"
          onClick={() => void navigate({ to: "/wagers" })}
          className="flex items-center gap-1 transition-colors hover:text-slate-200"
        >
          ← Back
        </button>
        <span className="text-slate-600">/</span>
        <Link to="/wagers" className="transition-colors hover:text-slate-200">Wagers</Link>
        <span className="text-slate-600">/</span>
        <span className="max-w-xs truncate text-slate-300">{detail.title}</span>
      </div>

      {/* ── Header card ── */}
      <Card className="grid gap-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold leading-snug text-slate-100">{detail.title}</h1>
          <StatusBadge status={detail.status} />
        </div>

        {detail.description && (
          <p className="text-sm leading-relaxed text-slate-400">{detail.description}</p>
        )}

        {(canEndBetting || canResolve) && (
          <div className="flex flex-wrap gap-2">
            {canEndBetting && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => { setEndBettingError(null); setShowEndBettingModal(true); }}
                className="border border-amber-500/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15"
              >
                End Betting
              </Button>
            )}
            {canResolve && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => { setResolveError(null); setShowResolveModal(true); }}
                className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
              >
                Resolve Wager
              </Button>
            )}
          </div>
        )}
        {actionSuccess && <p className="text-sm text-emerald-300">{actionSuccess}</p>}

        <div className="flex flex-wrap gap-6 border-t border-slate-800 pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Pool</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-cyan-300">{formatMoney(detail.totalPool)}</p>
          </div>
          {hasCurrentUserBet && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">My Bet</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-300">
                {formatMoney(detail.currentUserBetAmount ?? "0")}
              </p>
              <p className="text-xs text-slate-500">{detail.currentUserBetOutcomeTitle}</p>
            </div>
          )}
          <div className="ml-auto flex flex-col justify-end gap-0.5 text-right text-xs text-slate-500">
            <span>{detail.categoryName}</span>
            <span>by <span className="text-slate-400">{detail.creatorName}</span></span>
            {detail.createdAt && <span>{new Date(detail.createdAt).toLocaleDateString()}</span>}
          </div>
        </div>

        {(isSuspended || isUnverified) && (
          <div className="flex gap-2">
            {isSuspended && (
              <span className="rounded-full border border-amber-500/35 px-2 py-0.5 text-xs text-amber-200">
                Suspended
              </span>
            )}
            {isUnverified && (
              <span className="rounded-full border border-amber-500/35 px-2 py-0.5 text-xs text-amber-200">
                Unverified
              </span>
            )}
          </div>
        )}
      </Card>

      {/* ── Outcomes card ── */}
      <Card className="grid gap-5">
        <CardTitle>Outcomes</CardTitle>

        <PoolBar outcomes={detail.outcomes} />

        <div className="grid gap-2">
          {detail.outcomes.map((outcome) => (
            <WagerOutcomeItem
              key={outcome.id}
              outcome={outcome}
              wagerStatus={detail.status}
              currentUserBetAmount={detail.currentUserBetAmount}
              currentUserBetOutcomeTitle={detail.currentUserBetOutcomeTitle}
              onClick={() => setOpenBetOutcomeId((cur) => (cur === outcome.id ? null : outcome.id))}
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

      <BetsSection wagerId={wagerId} currentUserId={user?.id} outcomes={detail.outcomes} refreshKey={betsRefreshKey} />

      <CommentSection wagerId={wagerId} currentUserId={user?.id} />

      <EndBettingModal
        open={showEndBettingModal}
        onOpenChange={(open) => { setShowEndBettingModal(open); if (!open) setEndBettingError(null); }}
        onConfirm={() => void handleEndBetting()}
        isLoading={isEndingBetting}
        error={endBettingError}
      />

      <ResolveWagerModal
        open={showResolveModal}
        onOpenChange={(open) => { setShowResolveModal(open); if (!open) setResolveError(null); }}
        outcomes={detail.outcomes}
        onConfirm={(id) => void handleResolve(id)}
        isLoading={isResolving}
        error={resolveError}
      />
    </div>
  );
}
