import { MoreHorizontal, Trophy, UsersRound } from "lucide-react";
import type { GroupPreviewMember, GroupSummary } from "@pb138/shared/schemas/groups";
import { cn } from "../../../lib/utils";

type GroupCardProps = {
  group: GroupSummary;
  isSelected: boolean;
  onClick: () => void;
};

function getMoneyTone(value: string) {
  const numericValue = Number(value);
  if (numericValue > 0) return "text-emerald-300";
  if (numericValue < 0) return "text-rose-300";
  return "text-slate-300";
}

function buildPreviewRows(topMembers: GroupPreviewMember[]) {
  return Array.from({ length: 3 }, (_, index) => topMembers[index] ?? null);
}

export function GroupCard({ group, isSelected, onClick }: GroupCardProps) {
  const isOwner = group.currentUserRole === "OWNER";
  const previewRows = buildPreviewRows(group.topMembers);

  return (
    <button type="button" onClick={onClick} className="group h-full w-full text-left">
      <article
        className={cn(
          "flex h-80 flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6",
          "transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out",
          "motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:scale-[1.015]",
          "group-hover:border-cyan-500/35 group-hover:bg-slate-900 group-hover:shadow-[0_24px_70px_-32px_rgba(8,145,178,0.45)]",
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

              <p className="mt-1 text-sm text-slate-400">{group.memberCount} members</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            <Trophy className="h-4 w-4" />
            Overall Performance
          </div>

          <div className="mt-5 grid gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold text-slate-100">Your net P/L</span>
              <span className={cn("font-mono text-sm font-semibold", getMoneyTone(group.netPnl))}>
                {group.netPnl}
              </span>
            </div>

            {previewRows.map((member, index) => (
              <div key={member?.id ?? `empty-${index}`} className="flex h-5 items-center justify-between gap-4">
                {member ? (
                  <>
                    <span className="truncate text-sm font-semibold text-slate-100">
                      {index + 1}. {member.username}
                    </span>
                    <span className={cn("font-mono text-sm font-semibold", getMoneyTone(member.netPnl))}>
                      {member.netPnl}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-slate-600">No member yet</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </article>
    </button>
  );
}