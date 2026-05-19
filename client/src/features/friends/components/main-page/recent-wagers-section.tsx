import { Link } from "@tanstack/react-router";
import type { FriendSummary, FriendWagerSummary } from "@pb138/shared/schemas/friends";
import { SharedWagerRow } from "./shared-wager-row";

type RecentWagersSectionProps = {
  friend: FriendSummary;
  recentWagers: FriendWagerSummary[];
  isLoading: boolean;
  error: unknown;
};

export function RecentWagersSection({ friend, recentWagers, isLoading, error }: RecentWagersSectionProps) {
  return (
    <div className="mt-7 min-w-0">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-100">Recent Wagers</h3>

        {friend.stats.totalWagers > 0 ? (
          <Link
            to="/friends/$friendId/wagers"
            params={{ friendId: String(friend.id) }}
            search={{ page: 1 }}
            className="text-sm font-medium text-cyan-400 underline decoration-cyan-500/60 underline-offset-4 transition-colors hover:text-cyan-300"
          >
            view all
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-400">Loading recent wagers...</p>
      ) : error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
          {error instanceof Error ? error.message : "Unable to load friend statistics."}
        </div>
      ) : recentWagers.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-800 px-4 py-5 text-sm text-slate-400">
          No resolved wagers together yet.
        </div>
      ) : (
        <div className="mt-4 flex min-w-0 flex-col gap-3">
          {recentWagers.map((wager) => (
            <SharedWagerRow key={wager.wagerId} wager={wager} />
          ))}
        </div>
      )}
    </div>
  );
}