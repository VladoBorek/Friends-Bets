import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Inbox, Send } from "lucide-react";
import { toast } from "sonner";
import {
  acceptFriendRequest,
  fetchAllFriendRequests,
  rejectFriendRequest,
} from "../../../../api/friends-discovery-api";
import { friendsKeys } from "../../../../api/friends-query-options";
import { useAuth } from "../../../../lib/auth-context";
import { cn } from "../../../../lib/utils";
import { Dialog } from "../../dialog";
import { FriendsDialogShell } from "../dialog/friends-dialog-shell";
import { PendingRequestList } from "./pending-request-list";

type PendingRequestsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PendingTab = "incoming" | "outgoing";

export function PendingRequestsDialog({
  open,
  onOpenChange,
}: PendingRequestsDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<PendingTab>("incoming");
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);
  const [pendingActionType, setPendingActionType] = useState<"accept" | "reject" | null>(null);

  const requestKeys = {
    all: ["friend-requests", user?.id] as const,
    list: (direction: PendingTab) => ["friend-requests", user?.id, direction] as const,
  };

  const incomingQuery = useQuery({
    queryKey: requestKeys.list("incoming"),
    queryFn: () => fetchAllFriendRequests("incoming"),
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const outgoingQuery = useQuery({
    queryKey: requestKeys.list("outgoing"),
    queryFn: () => fetchAllFriendRequests("outgoing"),
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onMutate: (requestId) => {
      setPendingActionId(requestId);
      setPendingActionType("accept");
    },
    onSuccess: async () => {
      toast.success("Friend request accepted");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: requestKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["friend-requests-count", user?.id] }),
        queryClient.invalidateQueries({ queryKey: friendsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["friends", "discover", user?.id] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to accept friend request");
    },
    onSettled: () => {
      setPendingActionId(null);
      setPendingActionType(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onMutate: (requestId) => {
      setPendingActionId(requestId);
      setPendingActionType("reject");
    },
    onSuccess: async () => {
      toast.success("Friend request rejected");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: requestKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["friend-requests-count", user?.id] }),
        queryClient.invalidateQueries({ queryKey: friendsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["friends", "discover", user?.id] }),
      ]);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to reject friend request");
    },
    onSettled: () => {
      setPendingActionId(null);
      setPendingActionType(null);
    },
  });

  const activeQuery = activeTab === "incoming" ? incomingQuery : outgoingQuery;
  const requests = activeQuery.data ?? [];

  const counts = useMemo(
    () => ({
      incoming: incomingQuery.data?.length ?? 0,
      outgoing: outgoingQuery.data?.length ?? 0,
    }),
    [incomingQuery.data, outgoingQuery.data],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FriendsDialogShell
        title="Pending Requests"
        contentClassName="sm:max-w-2xl"
      >
        <div className="inline-flex w-fit rounded-xl border border-slate-800 bg-slate-950/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("incoming")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === "incoming"
                ? "bg-cyan-500/15 text-cyan-100"
                : "text-slate-400 hover:text-slate-100",
            )}
          >
            <Inbox className="h-4 w-4" />
            Incoming
            <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">
              {counts.incoming}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("outgoing")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab === "outgoing"
                ? "bg-cyan-500/15 text-cyan-100"
                : "text-slate-400 hover:text-slate-100",
            )}
          >
            <Send className="h-4 w-4" />
            Outgoing
            <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">
              {counts.outgoing}
            </span>
          </button>
        </div>

        <PendingRequestList
          type={activeTab}
          requests={requests}
          isLoading={activeQuery.isLoading || activeQuery.isFetching}
          error={activeQuery.error}
          pendingActionId={pendingActionId}
          pendingActionType={pendingActionType}
          onAccept={(requestId) => acceptMutation.mutate(requestId)}
          onReject={(requestId) => rejectMutation.mutate(requestId)}
        />

        <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-3 text-xs text-slate-500">
          <ArrowUpRight className="mr-1 inline h-3.5 w-3.5" />
          Outgoing cancel stays disabled until the backend endpoint exists.
        </div>
      </FriendsDialogShell>
    </Dialog>
  );
}
