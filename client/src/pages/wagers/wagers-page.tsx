import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  paginatedCategoriesResponseSchema,
  paginatedWagersResponseSchema,
  type CategorySummary,
  type PaginatedWagersResponse,
} from "@pb138/shared/schemas/wager";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { WagerPagination } from "../../features/wagers/components/wager-pagination";
import { CreateWagerModal } from "../../features/wagers/components/create-wager-modal";
import { WagerCard } from "../../features/wagers/components/wager-card";
import { WagersFilterPanel, type StatusFilter, type InvolvementFilter } from "../../features/wagers/components/wagers-filter-panel";
import { WAGERS_PAGE_SIZE } from "../../features/wagers/utils/wagers-search";
import { useAuth } from "../../lib/auth-context";
import { Route } from "../../routes/wagers/index";
import { readJsonOrThrow } from "../../api/http";
import { Spinner } from "../../components/ui/spinner";

export function WagersPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { page } = Route.useSearch();
  const { user } = useAuth();

  const [result, setResult] = useState<PaginatedWagersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [involvementFilter, setInvolvementFilter] = useState<InvolvementFilter>("ALL");

  const isSuspended = Boolean(user?.suspendedUntil && new Date(user.suspendedUntil).getTime() > Date.now());
  const isUnverified = user?.isVerified === false;
  const readOnly = isSuspended || isUnverified;

  const offset = (page - 1) * WAGERS_PAGE_SIZE;

  const activeFilterCount = [
    search !== "",
    statusFilter !== "ALL",
    categoryFilter !== "ALL",
    involvementFilter !== "ALL",
  ].filter(Boolean).length;

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
    const response = await fetch(buildUrl(), {
      signal,
      credentials: "same-origin",
    });

    return paginatedWagersResponseSchema.parse(
      await readJsonOrThrow(response, "Unable to load wagers"),
    );
  };

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        setResult(await fetchWagers(controller.signal));
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Unable to load wagers");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, categoryFilter, involvementFilter]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/wagers/categories?limit=50&offset=0", {
          credentials: "same-origin",
        });

        const json = paginatedCategoriesResponseSchema.parse(
          await readJsonOrThrow(response, "Unable to load categories"),
        );

        setCategories(json.data);
      } catch {
        setCategories([]);
      }
    }

    void loadCategories();
  }, []);

  const handleFilterChange = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    void navigate({ to: "/wagers", search: { page: 1 } });
  };

  const clearAllFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setInvolvementFilter("ALL");
    void navigate({ to: "/wagers", search: { page: 1 } });
  };

  const filterPanelProps = {
    search,
    onSearchChange: handleFilterChange(setSearch),
    statusFilter,
    onStatusChange: handleFilterChange(setStatusFilter),
    categoryFilter,
    onCategoryChange: handleFilterChange(setCategoryFilter),
    involvementFilter,
    onInvolvementChange: handleFilterChange(setInvolvementFilter),
    categories,
    showInvolvement: Boolean(user),
  };

  const wagers = result?.data ?? [];
  const pagination = result?.pagination ?? null;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  const handlePageChange = (newPage: number) => {
    void navigate({ to: "/wagers", search: { page: newPage } });
  };

  const navigateToWager = (wagerId: number) => {
    void navigate({ to: "/wagers/$wagerId", params: { wagerId: String(wagerId) } });
  };

  const refreshWagers = async () => {
    const fresh = await fetchWagers();
    setResult(fresh);
  };

  return (
    <div className="flex gap-6">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-6 grid gap-4">
          <Button
            onClick={() => setModalOpen(true)}
            disabled={readOnly}
            className="w-full"
          >
            + Create Wager
          </Button>
          <WagersFilterPanel {...filterPanelProps} />
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-left text-xs text-slate-500 hover:text-rose-400 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center gap-2 lg:hidden">
          <Button
            onClick={() => setModalOpen(true)}
            disabled={isSuspended || isUnverified}
            className="flex-1"
          >
            + Create Wager
          </Button>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="relative flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100"
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[11px] font-bold text-slate-900">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {pagination && (
          <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
            <span>{pagination.total} wager{pagination.total !== 1 ? "s" : ""}</span>
            <span>Page {page} / {totalPages}</span>
          </div>
        )}

        {isLoading && <div className="flex justify-center py-16"><Spinner className="h-8 w-8" /></div>}
        {error && <p className="text-rose-300">{error}</p>}
        {!isLoading && !error && wagers.length === 0 && (
          <p className="text-slate-400">No wagers match the current filters.</p>
        )}
        {!isLoading && !error && wagers.length > 0 && (
          <div className="grid gap-4">
            {wagers.map((wager) => (
              <WagerCard
                key={wager.id}
                wager={wager}
                currentUserId={user?.id}
                onClick={() => navigateToWager(wager.id)}
              />
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

      <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <DialogContent>
          <DialogHeader className="border-b border-slate-800 px-6 py-4">
            <DialogTitle>
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[11px] font-bold text-slate-900">
                  {activeFilterCount}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-5">
            <WagersFilterPanel {...filterPanelProps} />
          </div>
          <div className="flex items-center gap-3 border-t border-slate-800 px-6 py-4">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-sm text-slate-500 hover:text-rose-400 transition-colors"
              >
                Clear all
              </button>
            )}
            <Button onClick={() => setMobileFiltersOpen(false)} className="flex-1">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}