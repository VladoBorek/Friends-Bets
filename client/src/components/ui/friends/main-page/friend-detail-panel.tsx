import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { FriendSummary, FriendWagerSummary } from "@pb138/shared/schemas/friends";
import { friendsQueries } from "../../../../api/friends-query-options";
import { cn } from "../../../../lib/utils";
import { Card } from "../../card";

type FriendDetailPanelProps = {
  friend: FriendSummary | null;
};

const statCardClassName = cn(
  "rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-4",
  "transition-[transform,border-color,background-color,box-shadow] duration-300 ease-out",
  "motion-safe:hover:-translate-y-0.5",
  "hover:border-cyan-500/20 hover:bg-slate-950/60 hover:shadow-lg hover:shadow-cyan-950/10",
);

function formatRecord(friend: FriendSummary) {
  const { wins, losses, draws } = friend.stats;
  return `${wins}W - ${losses}L - ${draws}D`;
}

function formatMoney(value: string) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}

function getMoneyTone(value: string) {
  const numericValue = Number(value);

  if (numericValue > 0) return "text-emerald-300";
  if (numericValue < 0) return "text-rose-300";
  return "text-slate-200";
}

function getHeadToHeadMeta(result: FriendWagerSummary["headToHeadResult"]) {
  if (result === "WIN") {
    return {
      label: "YOU WON",
      className: "text-emerald-300",
    };
  }

  if (result === "LOSS") {
    return {
      label: "YOU LOST",
      className: "text-rose-300",
    };
  }

  return {
    label: "DRAW",
    className: "text-amber-300",
  };
}

function SharedWagerRow({ wager }: { wager: FriendWagerSummary }) {
  return (
    <Link
      to="/wagers/$wagerId"
      params={{ wagerId: String(wager.wagerId) }}
      className={cn(
        "block rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-4",
        "transition-[transform,border-color,background-color] duration-200 ease-out",
        "motion-safe:hover:-translate-y-0.5",
        "hover:border-cyan-500/25 hover:bg-slate-950/60",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-100">{wager.title}</p>
          <p className="mt-2 text-sm text-slate-400">
            You: {wager.currentUserOutcomeTitle ?? "n/a"} · Them: {wager.friendOutcomeTitle ?? "n/a"}
          </p>
          {wager.headToHeadResult ? (() => {
            const resultMeta = getHeadToHeadMeta(wager.headToHeadResult);

            return (
              <p className={cn("mt-2 text-sm font-medium", resultMeta.className)}>
                {resultMeta.label}
              </p>
            );
          })() : null}
        </div>

        <p className={cn("shrink-0 text-lg font-semibold", getMoneyTone(wager.currentUserNetPnl))}>
          {formatMoney(wager.currentUserNetPnl)}
        </p>
      </div>
    </Link>
  );
}

export function FriendDetailPanel({ friend }: FriendDetailPanelProps) {
  const friendId = friend?.id ?? null;

  const detailQuery = useQuery({
    ...friendsQueries.detail(friendId ?? 0),
    enabled: friendId !== null,
  });

  if (!friend) {
    return (
      <Card className="rounded-2xl border-slate-800 p-5">
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-100">Friend Summary</h2>
          <p className="text-sm text-slate-400">Select a friend to open the detail panel.</p>
        </div>
      </Card>
    );
  }

  const detail = detailQuery.data?.data;
  const friendWithStats = detail?.friend ?? friend;
  const recentWagers = (detail?.recentWagers ?? []).slice(0, 3);

  return (
    <Card
      className={cn(
        "rounded-2xl border border-cyan-500/15 bg-slate-900/80 p-5",
        "shadow-[0_24px_60px_-28px_rgba(8,145,178,0.22)]",
      )}
    >
      <div className="flex items-center gap-4">
        <div className="grid size-14 place-items-center rounded-full bg-indigo-500/15 text-xl font-semibold text-indigo-200">
          {friendWithStats.username.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-2xl font-semibold text-slate-100">
            You vs. {friendWithStats.username}
          </h2>
          <p className="mt-1 truncate text-sm text-slate-400">
            Head-to-head record: {formatRecord(friendWithStats)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className={statCardClassName}>
          <p className="text-sm text-slate-400">Net P/L</p>
          <p className={cn("mt-4 text-2xl font-semibold", getMoneyTone(friendWithStats.stats.netPnl))}>
            {formatMoney(friendWithStats.stats.netPnl)}
          </p>
        </div>

        <div className={statCardClassName}>
          <p className="text-sm text-slate-400">Total Wagers</p>
          <p className="mt-4 text-2xl font-semibold text-slate-100">
            {friendWithStats.stats.totalWagers}
          </p>
        </div>

        <div className={statCardClassName}>
          <p className="text-sm text-slate-400">Win Rate</p>
          <p className="mt-4 text-2xl font-semibold text-slate-100">
            {friendWithStats.stats.winRate}%
          </p>
        </div>
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-100">Recent Wagers</h3>

          {friendWithStats.stats.totalWagers > 0 ? (
            <Link
              to="/friends/$friendId/wagers"
              params={{ friendId: String(friendWithStats.id) }}
              search={{ page: 1 }}
              className="text-sm font-medium text-cyan-400 underline decoration-cyan-500/60 underline-offset-4 transition-colors hover:text-cyan-300"
            >
              view all
            </Link>
          ) : null}
        </div>

        {detailQuery.isLoading ? (
          <p className="mt-4 text-sm text-slate-400">Loading recent wagers...</p>
        ) : detailQuery.isError ? (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
            {detailQuery.error instanceof Error
              ? detailQuery.error.message
              : "Unable to load friend statistics."}
          </div>
        ) : recentWagers.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-800 px-4 py-5 text-sm text-slate-400">
            No resolved wagers together yet.
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {recentWagers.map((wager) => (
              <SharedWagerRow key={wager.wagerId} wager={wager} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
