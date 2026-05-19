import { ChevronDown, UserPlus } from "lucide-react";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { cn } from "../../../../lib/utils";
import { canExpandDescription, getGroupDescription, getMoneyTone } from "../../utils/group-display";

type GroupDetailSummaryCardProps = {
  group: GroupSummary;
  memberCount: number;
  canManage: boolean;
  isDescriptionExpanded: boolean;
  isLeaving: boolean;
  isDeleting: boolean;
  onDescriptionToggle: () => void;
  onInviteClick: () => void;
  onLeaveClick: () => void;
  onDeleteClick: () => void;
};

export function GroupDetailSummaryCard({ group, memberCount, canManage, isDescriptionExpanded, isLeaving, isDeleting, onDescriptionToggle, onInviteClick, onLeaveClick, onDeleteClick }: GroupDetailSummaryCardProps) {
  const description = getGroupDescription(group.description);
  const canExpand = canExpandDescription(description);

  return (
    <Card className="flex shrink-0 flex-col rounded-2xl border-slate-800 bg-slate-950/45 p-4 xl:w-72">
      <div>
        <p className="text-sm text-slate-400">Your net P/L</p>
        <p className={cn("mt-2 font-mono text-2xl font-semibold", getMoneyTone(group.netPnl))}>{group.netPnl}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800 pt-5">
        <div>
          <p className="text-2xl font-semibold text-slate-100">{memberCount}</p>
          <p className="text-xs text-slate-500">members</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-emerald-300">{group.activeWagerCount}</p>
          <p className="text-xs text-slate-500">active wagers</p>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-800 pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Description</p>
        <p className={cn("mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300", !isDescriptionExpanded && "line-clamp-4")}>
          {description}
        </p>

        {canExpand ? (
          <button type="button" onClick={onDescriptionToggle} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-cyan-300 hover:text-cyan-200">
            {isDescriptionExpanded ? "Show less" : "Show full description"}
            <ChevronDown className={cn("h-4 w-4 transition-transform", isDescriptionExpanded && "rotate-180")} />
          </button>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-slate-800 pt-5">
        <Button type="button" onClick={onInviteClick} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Friend
        </Button>

        <Button type="button" variant="secondary" onClick={onLeaveClick} disabled={isLeaving}>
          {isLeaving ? "Leaving..." : "Leave Group"}
        </Button>

        {canManage ? (
          <Button type="button" variant="secondary" onClick={onDeleteClick} disabled={isDeleting} className="border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15">
            {isDeleting ? "Deleting..." : "Delete Group"}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}