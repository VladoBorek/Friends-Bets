import { useSearch, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, X, Plus, ArrowRight } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Button } from "../components/ui/utils/button";
import { Card } from "../components/ui/utils/card";
import { WagerCard } from "../features/wagers/components/wager-card";
import { groupsQueries } from "../api/groups/groups-query-options";
import { useAuth } from "../lib/auth-context";
import { useWalletOverview } from "../api/wallet/wallet-query-options";
import type { PaginatedWagersResponse, WagerSummary } from "@pb138/shared/schemas/wager";
import { formatCurrency, formatMoney } from "../features/wagers/utils/utils";
import { WAGERS_PAGE_SIZE } from "../features/wagers/utils/wagers-search";

function StatsCard({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 ${className}`}>
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-100 sm:text-3xl">{value}</p>
    </div>
  );
}

function DashboardSection({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function LoadingCard() {
  return (
    <Card className="rounded-2xl border-slate-800 p-6 text-sm text-slate-400">
      Loading...
    </Card>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="rounded-2xl border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-200">
      {message}
    </Card>
  );
}

function EmptyStateCard({ message }: { message: string }) {
  return (
    <Card className="rounded-2xl border-slate-800 p-8 text-center text-slate-400">
      <p>{message}</p>
    </Card>
  );
}

function GroupsPreviewSection() {
  const navigate = useNavigate();
  const groupsQuery = useQuery({
    ...groupsQueries.list(1, ""),
    placeholderData: keepPreviousData,
  });

  const groups = useMemo(() => groupsQuery.data?.data.slice(0, 3) ?? [], [groupsQuery.data?.data]);
  const totalGroups = groupsQuery.data?.pagination?.total ?? 0;
  const hasMore = totalGroups > 3;

  if (groupsQuery.isLoading) return <LoadingCard />;
  if (groupsQuery.isError) return <ErrorCard message="Failed to load groups" />;
  if (groups.length === 0)
    return <EmptyStateCard message="No groups yet. Create or join groups to get started!" />;

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <button
          key={group.id}
          type="button"
          onClick={() => navigate({ to: `/groups`, search: { page: 1 } })}
          className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/30 p-4 transition-colors hover:border-slate-700 hover:bg-slate-900/60"
        >
          <div className="flex-1 text-left">
            <p className="font-medium text-slate-100">{group.name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {group.memberCount} members • {group.activeWagerCount} active wagers
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-500" />
        </button>
      ))}
      {hasMore && (
        <Button
          variant="ghost"
          onClick={() => navigate({ to: `/groups`, search: { page: 1 } })}
          className="w-full text-slate-400 hover:text-slate-200"
        >
          View all {totalGroups} groups
        </Button>
      )}
    </div>
  );
}

function WagersPreviewSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wagers, setWagers] = useState<WagerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchWagers = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          limit: String(Math.max(WAGERS_PAGE_SIZE, 6)),
          offset: "0",
          q: "",
          status: "OPEN",
          category: "ALL",
          involvement: "MY_BETS",
        });

        const response = await fetch(`/api/wagers?${params.toString()}`, {
          method: "GET",
          credentials: "same-origin",
        });

        if (!response.ok) throw new Error("Failed to load wagers");
        const data = (await response.json()) as PaginatedWagersResponse;
        setWagers(data.data.slice(0, 3));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load wagers");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchWagers();
  }, [user?.id]);

  if (isLoading) return <LoadingCard />;
  if (error) return <ErrorCard message={error} />;
  if (wagers.length === 0)
    return <EmptyStateCard message="No active wagers. Create or join wagers to get started!" />;

  return (
    <div className="space-y-3">
      {wagers.map((wager) => (
        <WagerCard
          key={wager.id}
          wager={wager}
          currentUserId={user?.id}
          onClick={() => navigate({ to: `/wagers`, search: { page: 1 } })}
        />
      ))}
      <Button
        variant="ghost"
        onClick={() => navigate({ to: `/wagers`, search: { page: 1 } })}
        className="w-full text-slate-400 hover:text-slate-200"
      >
        View all wagers
      </Button>
    </div>
  );
}

function DashboardStats() {
  const { user } = useAuth();
  const walletQuery = useWalletOverview(user?.id);
  const [wagerStats, setWagerStats] = useState({ total: 0, active: 0 });

  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
      try {
        // Fetch active wagers count
        const activeParams = new URLSearchParams({
          limit: "1",
          offset: "0",
          status: "OPEN",
          category: "ALL",
          involvement: "MY_BETS",
        });
        const activeResponse = await fetch(`/api/wagers?${activeParams.toString()}`, {
          credentials: "same-origin",
        });
        const activeData = (await activeResponse.json()) as PaginatedWagersResponse;

        // Fetch total wagers count
        const totalParams = new URLSearchParams({
          limit: "1",
          offset: "0",
          status: "ALL",
          category: "ALL",
          involvement: "MY_BETS",
        });
        const totalResponse = await fetch(`/api/wagers?${totalParams.toString()}`, {
          credentials: "same-origin",
        });
        const totalData = (await totalResponse.json()) as PaginatedWagersResponse;

        setWagerStats({
          total: totalData.pagination.total,
          active: activeData.pagination.total,
        });
      } catch {
        // Silently fail, stats are not critical
      }
    };

    void fetchStats();
  }, [user?.id]);

  const balance = walletQuery.data?.data.balance ?? "0";

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <StatsCard label="Balance" value={formatCurrency(balance)} />
      <StatsCard label="Active Wagers" value={String(wagerStats.active)} />
      <StatsCard label="Total Wagers" value={String(wagerStats.total)} />
      <StatsCard
        label="Latest Transaction"
        value={
          walletQuery.data?.data.history?.[0]
            ? formatMoney(walletQuery.data.data.history[0].walletImpact)
            : "—"
        }
      />
    </div>
  );
}

export function HomePage() {
  const search = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });
  const [showVerifiedPopup, setShowVerifiedPopup] = useState(false);

  useEffect(() => {
    setShowVerifiedPopup(search.verified === "1");
  }, [search.verified]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {showVerifiedPopup && (
        <div className="relative rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4 shadow-lg shadow-emerald-950/20">
          <button
            type="button"
            onClick={() => setShowVerifiedPopup(false)}
            className="absolute right-3 top-3 inline-flex rounded-md p-1 text-emerald-200/80 transition-colors hover:bg-emerald-500/15 hover:text-emerald-100"
            aria-label="close verification popup"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-emerald-200">Email Verified</p>
              <p className="mt-1 text-sm text-emerald-100/90">
                Your account is now verified and ready for full access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Stats */}
      <div>
        <h1 className="mb-4 text-2xl font-bold text-slate-100 sm:text-3xl">Dashboard</h1>
        <DashboardStats />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => navigate({ to: `/wagers`, search: { page: 1 } })} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Wager
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate({ to: `/groups`, search: { page: 1 } })}
          className="gap-2 border border-slate-700 bg-slate-800/70 text-slate-100 hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Main Dashboard Sections */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        <DashboardSection
          title="Your Groups"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: `/groups`, search: { page: 1 } })}
              className="text-slate-400 hover:text-slate-200"
            >
              View all
            </Button>
          }
        >
          <GroupsPreviewSection />
        </DashboardSection>

        <DashboardSection
          title="Active Wagers"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: `/wagers`, search: { page: 1 } })}
              className="text-slate-400 hover:text-slate-200"
            >
              View all
            </Button>
          }
        >
          <WagersPreviewSection />
        </DashboardSection>
      </div>
    </div>
  );
}
