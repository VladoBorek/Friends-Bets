import { Dialog } from "../../../../components/ui/dialog";
import { FriendsAsyncState } from "../../../friends/components/friends-async-state";
import { FriendsDialogShell } from "../../../friends/components/dialog/friends-dialog-shell";
import { usePendingGroupInvitations } from "../../hooks/use-pending-group-invitations";
import { PendingInvitationRow } from "./pending-invitation-row";
import { PendingInvitationTabs } from "./pending-invitation-tabs";

type PendingGroupInvitationsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PendingGroupInvitationsDialog({ open, onOpenChange }: PendingGroupInvitationsDialogProps) {
  const pending = usePendingGroupInvitations(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FriendsDialogShell title="Pending Group Invites" contentClassName="sm:max-w-2xl">
        <PendingInvitationTabs activeTab={pending.activeTab} counts={pending.counts} onTabChange={pending.setActiveTab} />

        <FriendsAsyncState
          isLoading={pending.activeQuery.isLoading || pending.activeQuery.isFetching}
          error={pending.activeQuery.error}
          isEmpty={pending.invitations.length === 0}
          emptyMessage={pending.activeTab === "incoming" ? "No incoming group invites." : "No outgoing group invites."}
          skeletonCount={4}
          errorMessage="Unable to load group invites."
        >
          <div className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
            {pending.invitations.map((invite) => (
              <PendingInvitationRow
                key={invite.id}
                invite={invite}
                type={pending.activeTab}
                isExpanded={pending.expandedInviteId === invite.id}
                isAccepting={pending.pendingActionId === invite.id && pending.pendingActionType === "accept"}
                isRejecting={pending.pendingActionId === invite.id && pending.pendingActionType === "reject"}
                onToggleExpanded={() => pending.setExpandedInviteId((current) => (current === invite.id ? null : invite.id))}
                onAccept={() => pending.acceptMutation.mutate(invite.id)}
                onReject={() => pending.rejectMutation.mutate(invite.id)}
              />
            ))}
          </div>
        </FriendsAsyncState>
      </FriendsDialogShell>
    </Dialog>
  );
}