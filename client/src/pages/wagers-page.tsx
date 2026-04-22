import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { WagerSummary } from "../../../shared/src/schemas/wager";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { CreateWagerModal } from "../features/wagers/components/create-wager-modal";
import { StatusBadge } from "../features/wagers/components/status-badge";
import { WagerInlineBetMenu } from "../features/wagers/components/wager-inline-bet-menu";
import { WagerOutcomeItem } from "../features/wagers/components/wager-outcome-item";
import { formatMoney } from "../features/wagers/utils";
import { useAuth } from "../lib/auth-context";

type StatusFilter = "ALL" | "OPEN" | "PENDING" | "CLOSED";
type InvolvementFilter = "ALL" | "MINE" | "MY_BETS";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "PENDING", label: "Pending" },
  { value: "CLOSED", label: "Closed" },
];

export function WagersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wagers, setWagers] = useState<WagerSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openBetMenu, setOpenBetMenu] = useState<{ wagerId: number; outcomeId: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [involvementFilter, setInvolvementFilter] = useState<InvolvementFilter>("ALL");

  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());
  const isUnverified = user?.isVerified === false;

  const fetchWagers = async (signal?: AbortSignal) => {
    const response = await fetch("/api/wagers", signal ? { signal } : undefined);
    const json = (await response.json().catch(() => null)) as { data?: WagerSummary[]; message?: string } | null;
    if (!response.ok) throw new Error(json?.message ?? "Unable to load wagers");
    return json?.data ?? [];
  };

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setWagers(await fetchWagers(controller.signal));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Unable to load wagers");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  const categories = useMemo(() => {
    if (!wagers) return [];
    return [...new Set(wagers.map((w) => w.categoryName))].sort();
  }, [wagers]);

  const filtered = useMemo(() => {
    if (!wagers) return [];
    const q = search.toLowerCase().trim();
    return wagers.filter((w) => {
      if (q && !w.title.toLowerCase().includes(q) && !(w.description ?? "").toLowerCase().includes(q)) return false;
      if (statusFilter !== "ALL" && w.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && w.categoryName !== categoryFilter) return false;
      if (involvementFilter === "MINE" && w.createdById !== user?.id) return false;
      if (involvementFilter === "MY_BETS" && !w.currentUserBetAmount) return false;
      return true;
    });
  }, [wagers, search, statusFilter, categoryFilter, involvementFilter, user?.id]);

  const navigateToWager = (wagerId: number) => {
    void navigate({ to: "/wagers/$wagerId", params: { wagerId: String(wagerId) } });
  };

  const isOutcomeInteraction = (target: EventTarget | null) =>
    target instanceof HTMLElement && Boolean(target.closest('[data-outcome-interactive="true"]'));

  const toggleOutcomeBetMenu = (wagerId: number, outcomeId: number) => {
    setOpenBetMenu((cur) =>
      cur?.wagerId === wagerId && cur.outcomeId === outcomeId ? null : { wagerId, outcomeId },
    );
  };

  const refreshWagers = async () => {
    setWagers(await fetchWagers());
  };

  return (
    <div className="flex gap-6">
      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0">
        <div className="sticky top-6 grid gap-4">
          <Button
            onClick={() => setModalOpen(true)}
            disabled={isSuspended || isUnverified}
            className="w-full"
          >
            + Create Wager
          </Button>

          <div className="grid gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Search</label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title or description…"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Status</label>
            <div className="flex flex-col gap-1">
              {STATUS_FILTERS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                    statusFilter === value
                      ? "border border-cyan-400/35 bg-cyan-500/15 text-cyan-100"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {categories.length > 0 && (
            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-white"
              >
                <option value="ALL">All categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {user && (
            <div className="grid gap-2">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Involvement</label>
              <div className="flex flex-col gap-1">
                {([["ALL", "All wagers"], ["MINE", "Created by me"], ["MY_BETS", "My bets"]] as const).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setInvolvementFilter(value)}
                      className={`rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                        involvementFilter === value
                          ? "border border-cyan-400/35 bg-cyan-500/15 text-cyan-100"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── List ── */}
      <div className="min-w-0 flex-1">
        {isLoading && <p className="text-slate-300">Loading wagers…</p>}
        {error && <p className="text-rose-300">{error}</p>}
        {!isLoading && !error && filtered.length === 0 && (
          <p className="text-slate-400">No wagers match the current filters.</p>
        )}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid gap-4">
            {filtered.map((wager) => (
              <Card
                key={wager.id}
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  if (isOutcomeInteraction(event.target)) return;
                  navigateToWager(wager.id);
                }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigateToWager(wager.id);
                  }
                }}
                className="cursor-pointer transition-colors hover:border-cyan-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{wager.title}</CardTitle>
                  <StatusBadge status={wager.status} className="shrink-0" />
                </div>
                {wager.description && (
                  <CardDescription className="mt-1">{wager.description}</CardDescription>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{wager.categoryName}</span>
                  <span className="text-slate-600">·</span>
                  <span>by {wager.creatorName}</span>
                  <span className="ml-auto font-semibold text-cyan-200">
                    Pool: {formatMoney(wager.totalPool)}
                  </span>
                </div>
                {(isSuspended || isUnverified) && (
                  <div className="mt-2 flex gap-2">
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
                <div className="mt-3 space-y-2">
                  {wager.outcomes.map((outcome) => (
                    <WagerOutcomeItem
                      key={outcome.id}
                      outcome={outcome}
                      wagerStatus={wager.status}
                      currentUserBetAmount={wager.currentUserBetAmount}
                      currentUserBetOutcomeTitle={wager.currentUserBetOutcomeTitle}
                      onClick={() => toggleOutcomeBetMenu(wager.id, outcome.id)}
                      isMenuOpen={openBetMenu?.wagerId === wager.id && openBetMenu.outcomeId === outcome.id}
                      menu={(
                        <div data-outcome-interactive="true" className="mt-3">
                          <WagerInlineBetMenu
                            wagerId={wager.id}
                            outcomeId={outcome.id}
                            outcomeTitle={outcome.title}
                            canPlaceBet={wager.status === "OPEN" && !isSuspended && !isUnverified && !wager.currentUserBetAmount}
                            disabledMessage={
                              wager.status !== "OPEN"
                                ? "Betting is closed for this wager."
                                : wager.currentUserBetAmount
                                  ? `You already placed a bet of ${formatMoney(wager.currentUserBetAmount)} on ${wager.currentUserBetOutcomeTitle ?? "your selected outcome"}.`
                                  : isSuspended
                                    ? "Suspended users cannot place bets."
                                    : isUnverified
                                      ? "Account must be verified to perform this action."
                                      : "Betting is unavailable for this account."
                            }
                            onBetPlaced={refreshWagers}
                          />
                        </div>
                      )}
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateWagerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={refreshWagers}
      />
    </div>
  );
}
