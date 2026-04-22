import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { Card, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import type { WagerDetail } from "../../../shared/src/schemas/wager";
import { WagerInlineBetMenu } from "../components/wager-inline-bet-menu";
import { WagerOutcomeItem } from "../components/wager-outcome-item";

interface WagerDetailPageProps {
  wagerId: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(value: string | number): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : String(value);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Request failed";
}

const OUTCOME_COLORS = [
  { bar: "bg-cyan-500",    dot: "bg-cyan-400",    label: "text-cyan-300"   },
  { bar: "bg-violet-500",  dot: "bg-violet-400",  label: "text-violet-300" },
  { bar: "bg-amber-500",   dot: "bg-amber-400",   label: "text-amber-300"  },
  { bar: "bg-emerald-500", dot: "bg-emerald-400", label: "text-emerald-300"},
  { bar: "bg-rose-500",    dot: "bg-rose-400",    label: "text-rose-300"   },
  { bar: "bg-blue-500",    dot: "bg-blue-400",    label: "text-blue-300"   },
  { bar: "bg-orange-500",  dot: "bg-orange-400",  label: "text-orange-300" },
  { bar: "bg-pink-500",    dot: "bg-pink-400",    label: "text-pink-300"   },
] as const;

// ─── StatusBadge ─────────────────────────────────────────────────────────────

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

// ─── PoolBar ─────────────────────────────────────────────────────────────────

function PoolBar({ outcomes }: { outcomes: WagerDetail["outcomes"] }) {
  const total = outcomes.reduce((s, o) => s + Number(o.totalBet), 0);
  const equal = 100 / outcomes.length;

  return (
    <div className="grid gap-2">
      {/* Segmented bar */}
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
        {outcomes.map((o, i) => {
          const pct = total > 0 ? (Number(o.totalBet) / total) * 100 : equal;
          return (
            <div
              key={o.id}
              className={`${OUTCOME_COLORS[i % OUTCOME_COLORS.length].bar} opacity-80 transition-all duration-500`}
              style={{ width: `${pct}%` }}
              title={`${o.title}: ${pct.toFixed(1)}%`}
            />
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {outcomes.map((o, i) => {
          const pct = total > 0 ? (Number(o.totalBet) / total) * 100 : equal;
          const color = OUTCOME_COLORS[i % OUTCOME_COLORS.length];
          return (
            <div key={o.id} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${color.dot}`} />
              <span className="text-xs text-slate-400">{o.title}</span>
              <span className={`text-xs font-medium ${color.label}`}>{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BetsSection ─────────────────────────────────────────────────────────────

type WagerBet = { id: number; userId: number; username: string; outcomeTitle: string; amount: string };

function BetsSection({ wagerId, currentUserId, outcomes, refreshKey }: {
  wagerId: number;
  currentUserId: number | undefined;
  outcomes: WagerDetail["outcomes"];
  refreshKey: number;
}) {
  const [bets, setBets] = useState<WagerBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/wagers/${wagerId}/bets`);
        const json = (await res.json().catch(() => null)) as { data?: WagerBet[] } | null;
        setBets(json?.data ?? []);
      } finally { setIsLoading(false); }
    }
    void load();
  }, [wagerId, refreshKey]);

  const outcomeColorMap = Object.fromEntries(
    outcomes.map((o, i) => [o.title, OUTCOME_COLORS[i % OUTCOME_COLORS.length]])
  );

  return (
    <Card>
      <div className="flex items-baseline gap-2">
        <CardTitle>Bets</CardTitle>
        {!isLoading && bets.length > 0 && (
          <span className="text-sm text-slate-500">{bets.length} {bets.length === 1 ? "bet" : "bets"}</span>
        )}
      </div>

      {isLoading && <p className="mt-3 text-sm text-slate-500">Loading bets…</p>}
      {!isLoading && bets.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No bets placed yet.</p>
      )}
      {!isLoading && bets.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Player</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Outcome</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bets.map((bet) => {
                const color = outcomeColorMap[bet.outcomeTitle];
                const isMe = bet.userId === currentUserId;
                return (
                  <tr key={bet.id} className={isMe ? "bg-cyan-500/5" : "hover:bg-slate-800/30"}>
                    <td className="px-4 py-2.5">
                      <span className={isMe ? "font-medium text-cyan-300" : "text-slate-300"}>
                        {bet.username}
                        {isMe && <span className="ml-1.5 text-xs text-slate-500">(you)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {color && <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />}
                        <span className="text-slate-400">{bet.outcomeTitle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums text-slate-200">{fmt(bet.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── CommentSection ───────────────────────────────────────────────────────────

type WagerComment = { id: number; userId: number; username: string; content: string; createdAt: string };

function CommentSection({ wagerId, currentUserId }: { wagerId: number; currentUserId: number | undefined }) {
  const [comments, setComments] = useState<WagerComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/wagers/${wagerId}/comments`);
        const json = (await res.json().catch(() => null)) as { data?: WagerComment[] } | null;
        setComments(json?.data ?? []);
      } finally { setIsLoading(false); }
    }
    void load();
  }, [wagerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/wagers/${wagerId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const json = (await res.json().catch(() => null)) as { data?: WagerComment; message?: string } | null;
      if (!res.ok) throw new Error(json?.message ?? "Failed to post comment");
      if (json?.data) setComments((prev) => [...prev, json.data!]);
      setDraft("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to post comment");
    } finally { setIsSubmitting(false); }
  };

  return (
    <Card>
      <div className="flex items-baseline gap-2">
        <CardTitle>Comments</CardTitle>
        {!isLoading && comments.length > 0 && (
          <span className="text-sm text-slate-500">{comments.length}</span>
        )}
      </div>

      <div className="mt-4 grid gap-2">
        {isLoading && <p className="text-sm text-slate-500">Loading comments…</p>}
        {!isLoading && comments.length === 0 && (
          <p className="text-sm text-slate-500">No comments yet. Be the first!</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg border border-slate-800 bg-slate-800/30 px-4 py-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-sm font-medium ${c.userId === currentUserId ? "text-cyan-300" : "text-slate-200"}`}>
                {c.username}
              </span>
              <span className="text-xs text-slate-600">
                {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">{c.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {currentUserId ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 grid gap-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a comment…" rows={3} />
          {submitError && <p className="text-xs text-rose-300">{submitError}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !draft.trim()} className="w-fit">
              {isSubmitting ? "Posting…" : "Post Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Sign in to leave a comment.</p>
      )}
    </Card>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">✕</button>
        </div>
        <div className="grid gap-4 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function EndBettingModal({ onClose, onConfirm, isLoading, error }: {
  onClose: () => void; onConfirm: () => void; isLoading: boolean; error: string | null;
}) {
  return (
    <ModalShell title="End Betting Period" onClose={onClose}>
      <p className="text-sm text-slate-300">
        Are you sure you want to end the betting period? Once closed,{" "}
        <span className="font-semibold text-amber-200">no new bets can be placed</span>.
      </p>
      <p className="text-xs text-slate-500">
        The wager moves to <span className="text-amber-300">Pending</span> while you determine the outcome.
      </p>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isLoading}>Cancel</Button>
        <Button type="button" onClick={onConfirm} disabled={isLoading}
          className="flex-1 border border-amber-500/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15">
          {isLoading ? "Ending…" : "End Betting"}
        </Button>
      </div>
    </ModalShell>
  );
}

function ResolveWagerModal({ outcomes, onClose, onConfirm, isLoading, error }: {
  outcomes: WagerDetail["outcomes"]; onClose: () => void; onConfirm: (outcomeId: number) => void;
  isLoading: boolean; error: string | null;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(outcomes[0]?.id ?? null);
  return (
    <ModalShell title="Resolve Wager" onClose={onClose}>
      <p className="text-sm text-slate-300">Select the winning outcome to close betting and distribute payouts.</p>
      <label className="flex flex-col gap-1 text-xs text-slate-300">
        Winning outcome
        <select value={selectedId?.toString() ?? ""} onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
          className="rounded border border-slate-700 bg-slate-900 p-2 text-white">
          <option value="" disabled>Select an outcome</option>
          {outcomes.map((o) => <option key={o.id} value={o.id.toString()}>{o.title}</option>)}
        </select>
      </label>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1" disabled={isLoading}>Cancel</Button>
        <Button type="button" onClick={() => { if (selectedId) onConfirm(selectedId); }} disabled={isLoading || !selectedId}
          className="flex-1 border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15">
          {isLoading ? "Resolving…" : "Resolve Wager"}
        </Button>
      </div>
    </ModalShell>
  );
}

// ─── WagerDetailPage ──────────────────────────────────────────────────────────

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
    } finally { setIsEndingBetting(false); }
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
    } finally { setIsResolving(false); }
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
        ? `You already placed a bet of ${fmt(detail.currentUserBetAmount ?? "0")} on ${detail.currentUserBetOutcomeTitle ?? "your selected outcome"}.`
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
        <button type="button" onClick={() => void navigate({ to: "/wagers" })}
          className="flex items-center gap-1 transition-colors hover:text-slate-200">
          ← Back
        </button>
        <span className="text-slate-600">/</span>
        <Link to="/wagers" className="transition-colors hover:text-slate-200">Wagers</Link>
        <span className="text-slate-600">/</span>
        <span className="truncate max-w-xs text-slate-300">{detail.title}</span>
      </div>

      {/* ── Header card ── */}
      <Card className="grid gap-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold leading-snug text-slate-100">{detail.title}</h1>
          <StatusBadge status={detail.status} />
        </div>

        {detail.description && (
          <p className="text-sm leading-relaxed text-slate-400">{detail.description}</p>
        )}

        {/* Creator actions */}
        {(canEndBetting || canResolve) && (
          <div className="flex flex-wrap gap-2">
            {canEndBetting && (
              <Button type="button" variant="secondary" size="sm"
                onClick={() => { setEndBettingError(null); setShowEndBettingModal(true); }}
                className="border border-amber-500/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15">
                End Betting
              </Button>
            )}
            {canResolve && (
              <Button type="button" variant="secondary" size="sm"
                onClick={() => { setResolveError(null); setShowResolveModal(true); }}
                className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15">
                Resolve Wager
              </Button>
            )}
          </div>
        )}
        {actionSuccess && <p className="text-sm text-emerald-300">{actionSuccess}</p>}

        {/* Stats row */}
        <div className="flex flex-wrap gap-6 border-t border-slate-800 pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Pool</p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums text-cyan-300">{fmt(detail.totalPool)}</p>
          </div>
          {hasCurrentUserBet && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">My Bet</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-300">{fmt(detail.currentUserBetAmount ?? "0")}</p>
              <p className="text-xs text-slate-500">{detail.currentUserBetOutcomeTitle}</p>
            </div>
          )}
          <div className="ml-auto flex flex-col justify-end gap-0.5 text-right text-xs text-slate-500">
            <span>{detail.categoryName}</span>
            <span>by <span className="text-slate-400">{detail.creatorName}</span></span>
            {detail.createdAt && <span>{new Date(detail.createdAt).toLocaleDateString()}</span>}
          </div>
        </div>

        {/* Account notices */}
        {(isSuspended || isUnverified) && (
          <div className="flex gap-2">
            {isSuspended && <span className="rounded-full border border-amber-500/35 px-2 py-0.5 text-xs text-amber-200">Suspended</span>}
            {isUnverified && <span className="rounded-full border border-amber-500/35 px-2 py-0.5 text-xs text-amber-200">Unverified</span>}
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

      {/* ── Bets ── */}
      <BetsSection wagerId={wagerId} currentUserId={user?.id} outcomes={detail.outcomes} refreshKey={betsRefreshKey} />

      {/* ── Comments ── */}
      <CommentSection wagerId={wagerId} currentUserId={user?.id} />

      {/* Modals */}
      {showEndBettingModal && (
        <EndBettingModal onClose={() => setShowEndBettingModal(false)} onConfirm={() => void handleEndBetting()}
          isLoading={isEndingBetting} error={endBettingError} />
      )}
      {showResolveModal && (
        <ResolveWagerModal outcomes={detail.outcomes} onClose={() => setShowResolveModal(false)}
          onConfirm={(id) => void handleResolve(id)} isLoading={isResolving} error={resolveError} />
      )}
    </div>
  );
}
