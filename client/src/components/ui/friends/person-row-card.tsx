// client/src/features/friends/components/person-row-card.tsx
import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { cn } from "../../../lib/utils";

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

export function PersonRowCard({ friend, isActive, onClick }: PersonRowCardProps) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
          "border-slate-800 bg-slate-900/70 hover:border-cyan-500/30 hover:bg-slate-900",
          isActive && "border-cyan-500/40 bg-cyan-500/10 shadow-lg shadow-cyan-950/20",
        )}
      >
        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-200">
          {getInitials(friend.username)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-100">{friend.username}</p>
          <p className="truncate text-xs text-slate-400">{friend.email}</p>
        </div>
      </div>
    </button>
  );
}
