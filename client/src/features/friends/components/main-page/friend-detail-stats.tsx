import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { cn } from "../../../../lib/utils";
import { formatMoney, getMoneyTone } from "../../utils/friend-display";

const statCardClassName = cn(
  "app-glow-surface rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-4",
  "transition-[transform] duration-300 ease-out",
  "motion-safe:hover:-translate-y-0.5",
  "hover:bg-slate-950/60",
);

type FriendDetailStatsProps = {
  friend: FriendSummary;
};

export function FriendDetailStats({ friend }: FriendDetailStatsProps) {
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      <div className={statCardClassName}>
        <p className="text-sm text-slate-400">Net P/L</p>
        <p className={cn("mt-4 text-2xl font-semibold", getMoneyTone(friend.stats.netPnl, "text-slate-200"))}>
          {formatMoney(friend.stats.netPnl)}
        </p>
      </div>

      <div className={statCardClassName}>
        <p className="text-sm text-slate-400">Total Wagers</p>
        <p className="mt-4 text-2xl font-semibold text-slate-100">{friend.stats.totalWagers}</p>
      </div>

      <div className={statCardClassName}>
        <p className="text-sm text-slate-400">Win Rate</p>
        <p className="mt-4 text-2xl font-semibold text-slate-100">{friend.stats.winRate}%</p>
      </div>
    </div>
  );
}