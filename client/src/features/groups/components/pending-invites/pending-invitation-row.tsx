import { ChevronDown } from "lucide-react";
import type { GroupInvitationSummary } from "@pb138/shared/schemas/groups";
import { Button } from "../../../../components/ui/button";
import { cn } from "../../../../lib/utils";
import { FriendPersonCell } from "../../../friends/components/dialog/friends-person-cell";
import { getGroupDescription } from "../../utils/group-display";
import { getInvitationPerson, type PendingGroupInviteTab } from "../../utils/group-invitations";
import { PendingInvitationDetails } from "./pending-invitation-details";

type PendingInvitationRowProps = {
  invite: GroupInvitationSummary;
  type: PendingGroupInviteTab;
  isExpanded: boolean;
  isAccepting: boolean;
  isRejecting: boolean;
  onToggleExpanded: () => void;
  onAccept: () => void;
  onReject: () => void;
};

export function PendingInvitationRow({ invite, type, isExpanded, isAccepting, isRejecting, onToggleExpanded, onAccept, onReject }: PendingInvitationRowProps) {
  const person = getInvitationPerson(invite, type);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={onToggleExpanded} className="flex min-w-0 flex-1 items-start gap-3 text-left" aria-expanded={isExpanded}>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">
                Group: <span className="text-cyan-200">{invite.group.name}</span>
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">{getGroupDescription(invite.group.description)}</p>
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{type === "incoming" ? "Invited by" : "Invited user"}</p>
              <FriendPersonCell username={person.username} email={person.email} />
            </div>
          </div>

          <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-slate-500 transition-transform", isExpanded && "rotate-180 text-cyan-300")} />
        </button>

        {type === "incoming" ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" variant="secondary" disabled={isRejecting || isAccepting} onClick={onReject} className="border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:border-rose-400/60 hover:bg-rose-500/15">
              {isRejecting ? "Rejecting..." : "Reject"}
            </Button>
            <Button size="sm" disabled={isRejecting || isAccepting} onClick={onAccept} className="border border-cyan-500/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/20">
              {isAccepting ? "Accepting..." : "Accept"}
            </Button>
          </div>
        ) : (
          <span className="shrink-0 rounded-md border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-slate-400">Pending</span>
        )}
      </div>

      {isExpanded ? <PendingInvitationDetails invite={invite} /> : null}
    </div>
  );
}