import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { CategorySummary, PaginatedWagersResponse, WagerSummary } from "@pb138/shared/schemas/wager";
import { Card, CardDescription, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { WagerPagination } from "../../components/ui/wagers/wager-pagination";
import { CreateWagerModal } from "../../features/wagers/components/create-wager-modal";
import { StatusBadge } from "../../features/wagers/components/status-badge";
import { WagerInlineBetMenu } from "../../features/wagers/components/wager-inline-bet-menu";
import { WagerOutcomeItem } from "../../features/wagers/components/wager-outcome-item";
import { WAGERS_PAGE_SIZE } from "../../features/wagers/wagers-search";
import { formatMoney } from "../../features/wagers/utils";
import { useAuth } from "../../lib/auth-context";
import { Route } from "../../routes/wagers/index";

type StatusFilter = "ALL" | "OPEN" | "PENDING" | "CLOSED";
type InvolvementFilter = "ALL" | "MINE" | "MY_BETS";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "PENDING", label: "Pending" },
  { value: "CLOSED", label: "Closed" },
];

export function WagersPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { page } = Route.useSearch();
  const { user } = useAuth();

  const [result, setResult] = useState<PaginatedWagersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [openBetMenu, setOpenBetMenu] = useState<{ wagerId: number; outcomeId: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [involvementFilter, setInvolvementFilter] = useState<InvolvementFilter>("ALL");

  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());
  const isUnverified = user?.isVerified === false;
  const readOnly = isSuspended || isUnverified;

  const offset = (page - 1) * WAGERS_PAGE_SIZE;

  const buildUrl = () => {
    const params = new URLSearchParams({
      limit: String(WAGERS_PAGE_SIZE),
      offset: String(offset),
      q: search,
      status: statusFilter,
      category: categoryFilter,
      involvement: involvementFilter,
    });
    return `/api/wagers?${params.toString()}`;
  };

  const fetchWagers = async (signal?: AbortSignal) => {
    const response = await fetch(buildUrl(), signal ? { signal } : undefined);
    const json = (await response.json().catch(() => null)) as PaginatedWagersResponse & { message?: string } | null;
    if (!response.ok) throw new Error(json?.message ?? "Unable to load wagers");
    if (!json) throw new Error("Unable to load wagers");
    return json;
  };

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    async function load() {
      try {
        setResult(await fetchWagers(controller.signal));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Unable to load wagers");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, categoryFilter, involvementFilter]);

  useEffect(() => {
    fetch("/api/wagers/categories")
      .then((r) => r.json() as Promise<{ data: CategorySummary[] }>)
      .then((json) => setCategories(json.data ?? []))
      .catch(() => undefined);
  }, []);

  const handleFilterChange = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    void navigate({ to: "/wagers", search: { page: 1 } });
  };

  const wagers: WagerSummary[] = result?.data ?? [];
  const pagination = result?.pagination ?? null;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  const handlePageChange = (newPage: number) => {
    void navigate({ to: "/wagers", search: { page: newPage } });
  };

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
    const fresh = await fetchWagers();
    setResult(fresh);
  };

  return (
    <div className="flex gap-6">
      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0">
        <div className="sticky top-6 grid gap-4">
          <Button
            onClick={() => setModalOpen(true)}
            disabled={readOnly}
            className="w-full"
          >
            + Create Wager
          </Button>

          <div className="grid gap-2">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Search</label>
            <Input
              value={search}
              onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
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
                  onClick={() => handleFilterChange(setStatusFilter)(value)}
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
                onChange={(e) => handleFilterChange(setCategoryFilter)(e.target.value)}
                className="rounded border border-slate-700 bg-slate-900 p-2 text-sm text-white"
              >
                <option value="ALL">All categories</option>
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
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
                      onClick={() => handleFilterChange(setInvolvementFilter)(value)}
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
        {pagination && (
          <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
            <span>{pagination.total} wager{pagination.total !== 1 ? "s" : ""}</span>
            <span>Page {page} / {totalPages}</span>
          </div>
        )}

        {isLoading && <p className="text-slate-300">Loading wagers…</p>}
        {error && <p className="text-rose-300">{error}</p>}
        {!isLoading && !error && wagers.length === 0 && (
          <p className="text-slate-400">No wagers match the current filters.</p>
        )}
        {!isLoading && !error && wagers.length > 0 && (
          <div className="grid gap-4">
            {wagers.map((wager) => (
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
                      disabled={readOnly}
                      onClick={() => {
                        if (readOnly) return;
                        toggleOutcomeBetMenu(wager.id, outcome.id);
                      }}
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

        {!isLoading && !error && (
          <div className="mt-6">
            <WagerPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
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
