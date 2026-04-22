// client/src/features/friends/components/person-row-card.tsx
import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { cn } from "../../../../lib/utils";

type PersonRowCardProps = {
  friend: FriendSummary;
  isActive: boolean;
  onClick: () => void;
};

function getInitials(username: string) {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatRecord(friend: FriendSummary) {
  const { wins, losses, draws } = friend.stats;
  return draws > 0 ? `${wins}W - ${losses}L - ${draws}D` : `${wins}W - ${losses}L`;
}

function formatSignedMoney(value: string) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;

  const fixed = numericValue.toFixed(2);
  return numericValue > 0 ? `+${fixed}` : fixed;
}

function getMoneyTone(value: string) {
  const numericValue = Number(value);
  if (numericValue > 0) return "text-emerald-300";
  if (numericValue < 0) return "text-rose-300";
  return "text-slate-300";
}


export function PersonRowCard({ friend, isActive, onClick }: PersonRowCardProps) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <div
        className={cn(
            "flex items-center gap-3 rounded-2xl border px-4 py-3",
            "border-slate-800 bg-slate-900/70",
            "transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out",
            "motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.01]",
            "hover:border-cyan-500/30 hover:bg-slate-900 hover:shadow-[0_18px_45px_-28px_rgba(8,145,178,0.28)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60",
            isActive &&
            "border-cyan-500/40 bg-cyan-500/10 shadow-[0_24px_60px_-26px_rgba(8,145,178,0.42)]",
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
