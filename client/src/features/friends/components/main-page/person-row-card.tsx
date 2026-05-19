import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { cn } from "../../../../lib/utils";
import { formatRecord, formatSignedMoney, getInitials, getMoneyTone } from "../../utils/friend-display";

type PersonRowCardProps = {
  friend: FriendSummary;
  isActive: boolean;
  onClick: () => void;
};

export function PersonRowCard({ friend, isActive, onClick }: PersonRowCardProps) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <div
        className={cn(
          "app-glow-surface flex items-center gap-3 rounded-2xl border px-4 py-3",
          "border-slate-800 bg-slate-900/70",
          "transition-[transform] duration-200 ease-out",
          "motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]",
          "hover:bg-slate-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60",
          isActive && "app-glow-surface-active border-cyan-500/40 bg-cyan-500/10",
        )}
      >
        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-200">
          {getInitials(friend.username)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100">{friend.username}</p>
          <p className="truncate text-xs text-slate-400">{formatRecord(friend)}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className={cn("text-sm font-semibold", getMoneyTone(friend.stats.netPnl))}>
            {formatSignedMoney(friend.stats.netPnl)}
          </p>
        </div>
      </div>
    </button>
  );
}