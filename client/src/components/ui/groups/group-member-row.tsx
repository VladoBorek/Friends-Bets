import { Trash2 } from "lucide-react";
import type { GroupMemberSummary } from "@pb138/shared/schemas/groups";
import { Button } from "../button";

type GroupMemberRowProps = {
  member: GroupMemberSummary;
  canRemove: boolean;
  isRemoving: boolean;
  onRemove: (userId: number) => void;
};

function getInitials(username: string) {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function GroupMemberRow({
  member,
  canRemove,
  isRemoving,
  onRemove,
}: GroupMemberRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-200">
          {getInitials(member.username)}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-100">{member.username}</p>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {member.groupRole}
            </span>
          </div>
          <p className="truncate text-xs text-slate-500">{member.email}</p>
        </div>
      </div>

      {canRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isRemoving}
          onClick={() => onRemove(member.id)}
          className="shrink-0 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
          aria-label={`Remove ${member.username}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}