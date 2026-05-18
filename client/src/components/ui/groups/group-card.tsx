import { Trophy, UsersRound } from "lucide-react";
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
    <button type="button" onClick={onClick} className="group w-full text-left">
      <article
        className={cn(
          "app-glow-surface flex min-h-64 flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 lg:p-6",
          "transition-[transform] duration-200 ease-out",
          "motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:scale-[1.015]",
          "group-hover:bg-slate-900",
          isSelected && "app-glow-surface-active border-cyan-500/45 bg-cyan-500/10",
        )}
      >
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300 sm:size-12">
            <UsersRound className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="min-w-0 max-w-[11rem] truncate text-base font-semibold text-slate-100 sm:max-w-[14rem] md:max-w-[16rem]">
                {group.name}
              </h3>

              {isOwner ? (
                <span className="shrink-0 rounded-md border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[0.68rem] font-semibold text-amber-300">
                  OWNER
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-sm text-slate-400">
              {group.memberCount} members - {group.activeWagerCount} active wagers
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 sm:text-sm sm:tracking-wide">
            <Trophy className="h-4 w-4" />
            Overall Performance
          </div>

          <div className="mt-4 grid gap-3">
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
