import { MoreHorizontal, UsersRound } from "lucide-react";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { cn } from "../../../lib/utils";

type GroupCardProps = {
  group: GroupSummary;
  isSelected: boolean;
  onClick: () => void;
};

export function GroupCard({ group, isSelected, onClick }: GroupCardProps) {
  const isOwner = group.currentUserRole === "OWNER";

  return (
    <button type="button" onClick={onClick} className="group w-full text-left">
      <article
        className={cn(
          "min-h-56 rounded-2xl border border-slate-800 bg-slate-900/70 p-5",
          "transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out",
          "motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:scale-[1.015]",
          "group-hover:border-cyan-500/35 group-hover:bg-slate-900 group-hover:shadow-[0_24px_70px_-32px_rgba(8,145,178,0.45)]",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-500/60",
          isSelected && "border-cyan-500/45 bg-cyan-500/10 shadow-[0_24px_70px_-32px_rgba(8,145,178,0.55)]",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300">
              <UsersRound className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-slate-100">{group.name}</h3>

                {isOwner ? (
                  <span className="rounded-md bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-300">
                    OWNER
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-sm text-slate-400">
                {group.memberCount} members · {group.activeWagerCount} active wagers
              </p>
            </div>
          </div>

          <MoreHorizontal className="h-5 w-5 shrink-0 text-slate-500" />
        </div>

        {group.description ? (
          <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-400">{group.description}</p>
        ) : (
          <p className="mt-5 text-sm text-slate-500">No description yet.</p>
        )}

        <div className="mt-7 border-t border-slate-800 pt-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Group Activity</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xl font-semibold text-slate-100">{group.memberCount}</p>
              <p className="text-xs text-slate-500">members</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-emerald-300">{group.activeWagerCount}</p>
              <p className="text-xs text-slate-500">active wagers</p>
            </div>
          </div>
        </div>
      </article>
    </button>
  );
}