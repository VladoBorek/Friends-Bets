import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, Send } from "lucide-react";
import { toast } from "sonner";
import type { GroupInvitationSummary } from "@pb138/shared/schemas/groups";
import {
  acceptGroupInvitation,
  fetchAllGroupInvitations,
  rejectGroupInvitation,
} from "../../../api/groups/group-invitations-api";
import { groupsKeys } from "../../../api/groups/groups-query-options";
import { useAuth } from "../../../lib/auth-context";
import { cn } from "../../../lib/utils";
import { Button } from "../button";
import { Dialog } from "../dialog";
import { FriendsAsyncState } from "../friends/friends-async-state";
import { FriendsDialogShell } from "../friends/dialog/friends-dialog-shell";
import { FriendPersonCell } from "../friends/dialog/friends-person-cell";

type PendingTab = "incoming" | "outgoing";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function InvitationRow({
  invite,
  type,
  isAccepting,
  isRejecting,
  onAccept,
  onReject,
}: {
  invite: GroupInvitationSummary;
  type: PendingTab;
  isAccepting: boolean;
  isRejecting: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const person = type === "incoming" ? invite.requester : invite.addressee;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4">
      <div className="min-w-0">
        <FriendPersonCell username={person.username} email={person.email} />
        <p className="mt-1 truncate text-xs text-slate-500">Group: {invite.group.name}</p>
      </div>

      {type === "incoming" ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={isRejecting || isAccepting}
            onClick={onReject}
            className="border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:border-rose-400/60 hover:bg-rose-500/15"
          >
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
          <Button
            size="sm"
            disabled={isRejecting || isAccepting}
            onClick={onAccept}
            className="border border-cyan-500/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/20"
          >
            {isAccepting ? "Accepting..." : "Accept"}
          </Button>
        </div>
      ) : (
        <span className="rounded-md border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm text-slate-400">
          Pending
        </span>
      )}
    </div>
  );
}

export function PendingGroupInvitationsDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PendingTab>("incoming");
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);
  const [pendingActionType, setPendingActionType] = useState<"accept" | "reject" | null>(null);

  const invitationKeys = {
    all: ["group-invitations", user?.id] as const,
    list: (direction: PendingTab) => ["group-invitations", user?.id, direction] as const,
  };

  const incomingQuery = useQuery({
    queryKey: invitationKeys.list("incoming"),
    queryFn: () => fetchAllGroupInvitations("incoming"),
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const outgoingQuery = useQuery({
    queryKey: invitationKeys.list("outgoing"),
    queryFn: () => fetchAllGroupInvitations("outgoing"),
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptGroupInvitation,
    onMutate: (id) => {
      setPendingActionId(id);
      setPendingActionType("accept");
    },
    onSuccess: async () => {
      toast.success("Group invitation accepted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invitationKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["group-invitations-count", user?.id] }),
        queryClient.invalidateQueries({ queryKey: groupsKeys.all }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to accept group invitation"),
    onSettled: () => {
      setPendingActionId(null);
      setPendingActionType(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectGroupInvitation,
    onMutate: (id) => {
      setPendingActionId(id);
      setPendingActionType("reject");
    },
    onSuccess: async () => {
      toast.success("Group invitation rejected");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invitationKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["group-invitations-count", user?.id] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to reject group invitation"),
    onSettled: () => {
      setPendingActionId(null);
      setPendingActionType(null);
    },
  });

  const activeQuery = activeTab === "incoming" ? incomingQuery : outgoingQuery;
  const invitations = activeQuery.data ?? [];

  const counts = useMemo(
    () => ({
      incoming: incomingQuery.data?.length ?? 0,
      outgoing: outgoingQuery.data?.length ?? 0,
    }),
    [incomingQuery.data, outgoingQuery.data],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FriendsDialogShell title="Pending Group Invites" contentClassName="sm:max-w-2xl">
        <div className="inline-flex w-fit rounded-xl border border-slate-800 bg-slate-950/60 p-1">
          {(["incoming", "outgoing"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab ? "bg-cyan-500/15 text-cyan-100" : "text-slate-400 hover:text-slate-100",
              )}
            >
              {tab === "incoming" ? <Inbox className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {tab === "incoming" ? "Incoming" : "Outgoing"}
              <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">{counts[tab]}</span>
            </button>
          ))}
        </div>

        <FriendsAsyncState
          isLoading={activeQuery.isLoading || activeQuery.isFetching}
          error={activeQuery.error}
          isEmpty={invitations.length === 0}
          emptyMessage={activeTab === "incoming" ? "No incoming group invites." : "No outgoing group invites."}
          skeletonCount={4}
          errorMessage="Unable to load group invites."
        >
          <div className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
            {invitations.map((invite) => (
              <InvitationRow
                key={invite.id}
                invite={invite}
                type={activeTab}
                isAccepting={pendingActionId === invite.id && pendingActionType === "accept"}
                isRejecting={pendingActionId === invite.id && pendingActionType === "reject"}
                onAccept={() => acceptMutation.mutate(invite.id)}
                onReject={() => rejectMutation.mutate(invite.id)}
              />
            ))}
          </div>
        </FriendsAsyncState>
      </FriendsDialogShell>
    </Dialog>
  );
}