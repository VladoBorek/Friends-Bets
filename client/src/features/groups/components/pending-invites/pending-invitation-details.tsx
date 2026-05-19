import { Activity, Users } from "lucide-react";
import type { GroupInvitationSummary } from "@pb138/shared/schemas/groups";
import { FriendPersonCell } from "../../../friends/components/dialog/friends-person-cell";
import { getGroupDescription } from "../../utils/group-display";

type PendingInvitationDetailsProps = {
  invite: GroupInvitationSummary;
};

export function PendingInvitationDetails({ invite }: PendingInvitationDetailsProps) {
  return (
    <div className="mt-4 border-t border-slate-800 pt-4">
      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/45 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Group</p>
        <h3 className="mt-2 break-words text-xl font-semibold leading-snug text-cyan-100">{invite.group.name}</h3>

        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Description</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{getGroupDescription(invite.group.description)}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            <Users className="h-3.5 w-3.5" />
            Members
          </div>
          <p className="mt-2 text-xl font-semibold text-slate-100">{invite.group.memberCount}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            <Activity className="h-3.5 w-3.5" />
            Active wagers
          </div>
          <p className="mt-2 text-xl font-semibold text-emerald-300">{invite.group.activeWagerCount}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Members preview</p>
        <div className="flex flex-col gap-2">
          {invite.group.members.length > 0 ? (
            invite.group.members.map((member) => (
              <div key={member.id} className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2">
                <FriendPersonCell username={member.username} email={member.email} />
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-slate-400">No members to show.</p>
          )}
        </div>
      </div>
    </div>
  );
}