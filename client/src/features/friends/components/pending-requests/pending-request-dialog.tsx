import { ArrowUpRight } from "lucide-react";
import { Dialog } from "../../../../components/ui/dialog";
import { FriendsDialogShell } from "../dialog/friends-dialog-shell";
import { usePendingFriendRequests } from "../../hooks/use-pending-friend-requests";
import { PendingRequestList } from "./pending-request-list";
import { PendingRequestTabs } from "./pending-request-tabs";

type PendingRequestsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PendingRequestsDialog({ open, onOpenChange }: PendingRequestsDialogProps) {
  const pending = usePendingFriendRequests(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FriendsDialogShell title="Pending Requests" contentClassName="sm:max-w-2xl">
        <PendingRequestTabs
          activeTab={pending.activeTab}
          counts={pending.counts}
          onTabChange={pending.setActiveTab}
        />

        <PendingRequestList
          type={pending.activeTab}
          requests={pending.requests}
          isLoading={pending.activeQuery.isLoading || pending.activeQuery.isFetching}
          error={pending.activeQuery.error}
          pendingActionId={pending.pendingActionId}
          pendingActionType={pending.pendingActionType}
          onAccept={(requestId) => pending.acceptMutation.mutate(requestId)}
          onReject={(requestId) => pending.rejectMutation.mutate(requestId)}
        />

        <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-3 text-xs text-slate-500">
          <ArrowUpRight className="mr-1 inline h-3.5 w-3.5" />
          Outgoing cancel stays disabled until the backend endpoint exists.
        </div>
      </FriendsDialogShell>
    </Dialog>
  );
}