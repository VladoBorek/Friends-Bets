import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { createWagerRequestSchema, type CategorySummary, type WagerSummary } from "../../../shared/src/schemas/wager";
import { Button } from "../components/ui/button";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { WagerInlineBetMenu } from "../components/wager-inline-bet-menu";
import { WagerOutcomeItem } from "../components/wager-outcome-item";
import { useAuth } from "../lib/auth-context";

// ─── helpers ────────────────────────────────────────────────────────────────

type UserSearchResult = { id: number; username: string; email: string };

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  PENDING: "Pending",
  CLOSED: "Closed",
};

function statusColor(status: string) {
  if (status === "OPEN") return "border-cyan-400/50 bg-cyan-500/15 text-cyan-100";
  if (status === "PENDING") return "border-amber-400/50 bg-amber-500/15 text-amber-100";
  return "border-slate-600 bg-slate-800/50 text-slate-400";
}

function formatMoney(value: string): string {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : value;
}

function toErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const v = error as { response?: { data?: unknown }; message?: unknown };
    if (typeof v.response?.data === "string" && v.response.data.trim()) return v.response.data;
    if (v.response?.data && typeof v.response.data === "object") {
      const d = v.response.data as { message?: unknown };
      if (typeof d.message === "string" && d.message.trim()) return d.message;
    }
    if (typeof v.message === "string" && v.message.trim()) return v.message;
  }
  return "Unable to create wager";
}

// ─── UserSearchSection ───────────────────────────────────────────────────────

const MAX_OUTCOMES = 8;
const MIN_OUTCOMES = 2;

function UserSearchSection({
  invitedUsers,
  onAdd,
  onRemove,
}: {
  invitedUsers: UserSearchResult[];
  onAdd: (user: UserSearchResult) => void;
  onRemove: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length === 0) { setResults([]); setDropdownOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/users/search?email=${encodeURIComponent(value.trim())}`);
        if (!response.ok) return;
        const json = (await response.json()) as { data: UserSearchResult[] };
        const filtered = (json.data ?? []).filter((u) => !invitedUsers.some((inv) => inv.id === u.id));
        setResults(filtered);
        setDropdownOpen(filtered.length > 0);
      } catch { /* ignore */ } finally { setIsSearching(false); }
    }, 300);
  }

  function handleAdd(user: UserSearchResult) {
    onAdd(user);
    setQuery(""); setResults([]); setDropdownOpen(false);
  }

  return (
    <div className="grid gap-3 rounded border border-slate-700 p-4">
      <p className="text-sm font-medium text-slate-300">Invite users</p>
      {invitedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {invitedUsers.map((user) => (
            <span key={user.id} className="flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-200">
              <span>{user.username}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-400">{user.email}</span>
              <button type="button" onClick={() => onRemove(user.id)} className="ml-1 text-slate-400 hover:text-rose-400" aria-label={`Remove ${user.username}`}>✕</button>
            </span>
          ))}
        </div>
      )}
      <div ref={containerRef} className="relative">
        <Input value={query} onChange={(e) => handleQueryChange(e.target.value)} placeholder="Search by email address…" autoComplete="off" />
        {isSearching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">Searching…</span>}
        {dropdownOpen && results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded border border-slate-700 bg-slate-900 shadow-lg">
            {results.map((user) => (
              <li key={user.id}>
                <button type="button" onClick={() => handleAdd(user)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-800">
                  <span className="font-medium text-slate-200">{user.username}</span>
                  <span className="text-slate-400">{user.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── CreateWagerModal ────────────────────────────────────────────────────────

function CreateWagerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [outcomes, setOutcomes] = useState<string[]>(["Yes", "No"]);
  const [isPublic, setIsPublic] = useState(true);
  const [invitedUsers, setInvitedUsers] = useState<UserSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());
  const isUnverified = user?.isVerified === false;

  useEffect(() => {
    const controller = new AbortController();
    async function loadCategories() {
      try {
        const response = await fetch("/api/wagers/categories", { signal: controller.signal });
        const json = (await response.json().catch(() => null)) as { data?: CategorySummary[]; message?: string } | null;
        if (!response.ok) throw new Error(json?.message ?? "Unable to load categories");
        const loaded = json?.data ?? [];
        setCategories(loaded);
        if (loaded.length > 0) setSelectedCategoryId(String(loaded[0].id));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorMessage(toErrorMessage(error));
      } finally { setIsLoadingCategories(false); }
    }
    void loadCategories();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function updateOutcome(index: number, value: string) {
    setOutcomes((prev) => prev.map((o, i) => (i === index ? value : o)));
  }
  function addOutcome() { if (outcomes.length < MAX_OUTCOMES) setOutcomes((prev) => [...prev, ""]); }
  function removeOutcome(index: number) { if (outcomes.length > MIN_OUTCOMES) setOutcomes((prev) => prev.filter((_, i) => i !== index)); }
  function addInvitedUser(u: UserSearchResult) { setInvitedUsers((prev) => prev.some((x) => x.id === u.id) ? prev : [...prev, u]); }
  function removeInvitedUser(id: number) { setInvitedUsers((prev) => prev.filter((u) => u.id !== id)); }

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    if (isSuspended) { setErrorMessage("Suspended users cannot create wagers."); return; }
    if (isUnverified) { setErrorMessage("Account must be verified to perform this action."); return; }

    const parsed = createWagerRequestSchema.safeParse({
      title,
      description: description || undefined,
      categoryId: Number(selectedCategoryId),
      isPublic,
      outcomes: outcomes.map((o) => ({ title: o })),
      invitedUserIds: isPublic ? undefined : invitedUsers.map((u) => u.id),
    });

    if (!parsed.success) { setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid form data"); return; }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/wagers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await response.json().catch(() => null)) as { data?: { id?: number }; id?: number; message?: string } | null;
      if (!response.ok) throw new Error(json?.message ?? "Unable to create wager");
      onCreated();
      onClose();
    } catch (error) {
      setErrorMessage(toErrorMessage(error));
    } finally { setIsSubmitting(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-100">Create Wager</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">✕</button>
        </div>

        <form className="grid gap-4 px-6 py-5" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <label className="text-sm text-slate-300" htmlFor="modal-title">Title</label>
            <Input id="modal-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-300" htmlFor="modal-description">Description</label>
            <Textarea id="modal-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-300" htmlFor="modal-category">Category</label>
            <select
              id="modal-category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              disabled={isLoadingCategories || categories.length === 0}
              className="rounded border border-slate-700 bg-slate-800 p-2 text-white"
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-300">
              Outcomes <span className="text-slate-500">({outcomes.length}/{MAX_OUTCOMES})</span>
            </label>
            <div className="grid gap-2">
              {outcomes.map((outcome, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={outcome} onChange={(e) => updateOutcome(index, e.target.value)} placeholder={`Outcome ${index + 1}`} required />
                  <button
                    type="button"
                    onClick={() => removeOutcome(index)}
                    disabled={outcomes.length <= MIN_OUTCOMES}
                    className="rounded border border-slate-700 px-3 text-slate-400 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Remove outcome"
                  >✕</button>
                </div>
              ))}
            </div>
            {outcomes.length < MAX_OUTCOMES && (
              <button type="button" onClick={addOutcome} className="mt-1 w-fit text-sm text-slate-400 hover:text-white">+ Add outcome</button>
            )}
          </div>

          <Switch
            id="modal-isPublic"
            checked={isPublic}
            onChange={(checked) => { setIsPublic(checked); if (checked) setInvitedUsers([]); }}
            label={isPublic ? "Public — visible to everyone" : "Private — visible only to you and invited users"}
          />

          {!isPublic && (
            <UserSearchSection invitedUsers={invitedUsers} onAdd={addInvitedUser} onRemove={removeInvitedUser} />
          )}

          {isSuspended && <p className="text-sm text-amber-200">Suspended users cannot create wagers.</p>}
          {isUnverified && <p className="text-sm text-amber-200">Account must be verified to perform this action.</p>}
          {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              type="submit"
              disabled={isSubmitting || isSuspended || isUnverified || isLoadingCategories || categories.length === 0}
              className="flex-1"
            >
              {isSubmitting ? "Creating…" : "Create Wager"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── WagersPage ──────────────────────────────────────────────────────────────

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

  // filters
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
      } finally { setIsLoading(false); }
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
    setOpenBetMenu((cur) => cur?.wagerId === wagerId && cur.outcomeId === outcomeId ? null : { wagerId, outcomeId });
  };

  const refreshWagers = async () => {
    const next = await fetchWagers();
    setWagers(next);
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
                {([["ALL", "All wagers"], ["MINE", "Created by me"], ["MY_BETS", "My bets"]] as const).map(([value, label]) => (
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
                ))}
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
                onClick={(event) => { if (isOutcomeInteraction(event.target)) return; navigateToWager(wager.id); }}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget) return;
                  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigateToWager(wager.id); }
                }}
                className="cursor-pointer transition-colors hover:border-cyan-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{wager.title}</CardTitle>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor(wager.status)}`}>
                    {STATUS_LABELS[wager.status] ?? wager.status}
                  </span>
                </div>
                {wager.description && (
                  <CardDescription className="mt-1">{wager.description}</CardDescription>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>{wager.categoryName}</span>
                  <span className="text-slate-600">·</span>
                  <span>by {wager.creatorName}</span>
                  <span className="ml-auto font-semibold text-cyan-200">Pool: {formatMoney(wager.totalPool)}</span>
                </div>
                {(isSuspended || isUnverified) && (
                  <div className="mt-2 flex gap-2">
                    {isSuspended && <span className="rounded-full border border-amber-500/35 px-2 py-0.5 text-xs text-amber-200">Suspended</span>}
                    {isUnverified && <span className="rounded-full border border-amber-500/35 px-2 py-0.5 text-xs text-amber-200">Unverified</span>}
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

      {modalOpen && (
        <CreateWagerModal
          onClose={() => setModalOpen(false)}
          onCreated={refreshWagers}
        />
      )}
    </div>
  );
}
