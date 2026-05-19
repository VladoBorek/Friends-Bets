import { Link } from "@tanstack/react-router";
import type { FriendWagerSummary } from "@pb138/shared/schemas/friends";
import { cn } from "../../../../lib/utils";
import { formatMoney, getHeadToHeadMeta, getMoneyTone } from "../../utils/friend-display";

type SharedWagerRowProps = {
  wager: FriendWagerSummary;
};

export function SharedWagerRow({ wager }: SharedWagerRowProps) {
  const resultMeta = getHeadToHeadMeta(wager.headToHeadResult);

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
          <p className={cn("mt-2 text-sm font-medium", resultMeta.className)}>
            {resultMeta.label}
          </p>
        </div>

        <p className={cn("shrink-0 text-lg font-semibold", getMoneyTone(wager.headToHeadNetPnl, "text-slate-200"))}>
          {formatMoney(wager.headToHeadNetPnl)}
        </p>
      </div>
    </Link>
  );
}