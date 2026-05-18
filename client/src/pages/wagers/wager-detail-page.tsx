import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { WagerDetail } from "../../../../shared/src/schemas/wager";
import { Accordion } from "../../components/ui/utils/accordion";
import { Card, CardTitle } from "../../components/ui/utils/card";
import { PillTag } from "../../components/ui/utils/pill-tag";
import { BetsSection } from "../../features/wagers/components/bets-section";
import { CommentSection } from "../../features/wagers/components/comment-section";
import { CreateWagerModal } from "../../features/wagers/components/create-wager-modal";
import { DeleteWagerModal } from "../../features/wagers/components/delete-wager-modal";
import { EndBettingModal } from "../../features/wagers/components/end-betting-modal";
import { PoolBar } from "../../features/wagers/components/pool-bar";
import { ResolveWagerModal } from "../../features/wagers/components/resolve-wager-modal";
import { StatusBadge } from "../../features/wagers/components/status-badge";
import { WagerActionsMenu } from "../../features/wagers/components/wager-actions-menu";
import { WagerInlineBetMenu } from "../../features/wagers/components/wager-inline-bet-menu";
import { WagerOutcomeItem } from "../../features/wagers/components/wager-outcome-item";
import { formatMoney, toErrorMessage } from "../../features/wagers/utils";
import { useAuth } from "../../lib/auth-context";
import { publishWalletBalanceRefresh, refreshWalletOverview } from "../../api/wallet/wallet-query-options";
import { friendsKeys } from "../../api/friends/friends-query-options";

interface WagerDetailPageProps {
  wagerId: number;
}

export function WagerDetailPage({ wagerId }: WagerDetailPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [betsRefreshKey, setBetsRefreshKey] = useState(0);
  const [visibilityUsers, setVisibilityUsers] = useState<{ id: number; username: string; email: string }[]>([]);

  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());
  const isUnverified = user?.isVerified === false;
  const readOnly = isSuspended || isUnverified;
  const commentRestrictionMessage = isSuspended
    ? "Suspended users cannot comment"
    : isUnverified
      ? "Account must be verified to comment."
      : null;
  const isCreator = detail ? detail.createdById === user?.id : false;

  useEffect(() => {
    if (!detail || detail.isPublic || detail.createdById !== user?.id) return;
    fetch(`/api/wagers/${wagerId}/invitations`)
      .then((r) => r.json() as Promise<{ data: { id: number; username: string; email: string }[] }>)
      .then((json) => setVisibilityUsers(json.data ?? []))
      .catch(() => undefined);
  }, [detail, user?.id, wagerId]);

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

      if (typeof user?.id === "number") {
        void refreshWalletOverview(queryClient).catch((error: unknown) => {
          console.error("[wallet-sync] Failed to refresh wallet balance after payout", error);
        });
        publishWalletBalanceRefresh(user.id);
      }

      void queryClient.invalidateQueries({ queryKey: friendsKeys.all });
    } catch (e) {
      setResolveError(toErrorMessage(e));
    } finally {
      setIsResolving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/wagers/${wagerId}`, { method: "DELETE" });
      const json = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) throw new Error(json?.message ?? "Failed to delete wager");
      void navigate({ to: "/wagers", search: { page: 1 } });
    } catch (e) {
      setDeleteError(toErrorMessage(e));
    } finally {
      setIsDeleting(false);
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

  const canEndBetting = detail.status === "OPEN";
  const canResolve = detail.status !== "CLOSED";

  return (
    <div className="mx-auto grid max-w-3xl gap-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <button
          type="button"
          onClick={() => void navigate({ to: "/wagers", search: { page: 1 } })}
          className="flex items-center gap-1 transition-colors hover:text-slate-200"
        >
          ← Back
        </button>
        <span className="text-slate-600">/</span>
        <Link to="/wagers" search={{ page: 1 }} className="transition-colors hover:text-slate-200">Wagers</Link>
        <span className="text-slate-600">/</span>
        <span className="max-w-xs truncate text-slate-300">{detail.title}</span>
      </div>

      {/* ── Header card ── */}
      <Card className="grid gap-4">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
          <h1 className="flex-1 text-2xl font-semibold leading-snug text-slate-100">{detail.title}</h1>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <PillTag variant="category">{detail.categoryName}</PillTag>
            {!detail.isPublic && <PillTag variant="private">Private</PillTag>}
            <StatusBadge status={detail.status} />
            {isCreator && (
              <WagerActionsMenu
                wager={detail}
                canEndBetting={canEndBetting}
                canResolve={canResolve}
                onEndBetting={() => { setEndBettingError(null); setShowEndBettingModal(true); }}
                onResolve={() => { setResolveError(null); setShowResolveModal(true); }}
                onEdit={() => setShowEditModal(true)}
                onDelete={() => { setDeleteError(null); setShowDeleteModal(true); }}
              />
            )}
          </div>
        </div>

        {detail.description && (
          <p className="text-sm leading-relaxed text-slate-400">{detail.description}</p>
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
          <div className="ml-auto flex flex-col items-end gap-2 text-right text-xs text-slate-500">
          
          {/* Creator Tag */}
          <div className="flex items-center gap-1.5">
            <span>Created by:</span>
            <PillTag variant="creator">{detail.creatorName}</PillTag>
          </div>

          {/* Date */}
          {detail.createdAt && (
            <span className="mt-0.5">
              {new Date(detail.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>
        </div>

        {(readOnly) && (
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
              disabled={readOnly || hasCurrentUserBet}
              onClick={() => {
                if (readOnly || hasCurrentUserBet) return;
                setOpenBetOutcomeId((cur) => (cur === outcome.id ? null : outcome.id));
              }}
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

      {!detail.isPublic && visibilityUsers.length > 0 && (
        <Accordion
          title={
            <div className="flex items-center gap-3">
              <span className="text-xl font-semibold text-slate-100">Wager Members</span>
              <span className="rounded-full border border-slate-600/50 bg-slate-800/40 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                {visibilityUsers.length} member{visibilityUsers.length !== 1 ? "s" : ""}
              </span>
            </div>
          }
        >
          <div className="grid gap-1">
            {visibilityUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-1">
                <span className="text-sm text-slate-200">{u.username}</span>
                <span className="text-xs text-slate-500">{u.email}</span>
              </div>
            ))}
          </div>
        </Accordion>
      )}

      <CommentSection
        wagerId={wagerId}
        currentUserId={user?.id}
        isCommentingRestricted={Boolean(commentRestrictionMessage)}
        commentRestrictionMessage={commentRestrictionMessage ?? undefined}
      />

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

      <CreateWagerModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onCreated={() => {}}
        editingWager={detail}
        onEdited={() => void refreshDetail()}
      />

      <DeleteWagerModal
        open={showDeleteModal}
        onOpenChange={(open) => { setShowDeleteModal(open); if (!open) setDeleteError(null); }}
        wagerTitle={detail.title}
        onConfirm={() => void handleDelete()}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
