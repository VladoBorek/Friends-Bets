import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { friendsKeys } from "../../../../api/friends-query-options";
import {
  fetchAllUsers,
  fetchFriendRelationshipSnapshot,
  sendFriendRequest,
} from "../../../../api/friends-discovery-api";
import { useAuth } from "../../../../lib/auth-context";
import { Dialog } from "../../dialog";
import { Input } from "../../input";
import { FriendsDialogShell } from "../friends-dialog-shell";
import { FriendsPagination } from "..//friends-pagination";
import { AddFriendList } from "./add-friend-list";
import { DISCOVERY_PAGE_SIZE, filterUsers } from "./add-friend-dialog-utils";

type AddFriendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddFriendDialog({ open, onOpenChange }: AddFriendDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [optimisticPendingIds, setOptimisticPendingIds] = useState<number[]>([]);
  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);

  const deferredQuery = useDeferredValue(query);

  const usersQuery = useQuery({
    queryKey: ["users", "all"],
    queryFn: fetchAllUsers,
    enabled: open,
    staleTime: 60_000,
  });

  const relationshipQuery = useQuery({
    queryKey: ["friends", "relationship-snapshot", user?.id],
    queryFn: () => fetchFriendRelationshipSnapshot(user!.id),
    enabled: open && Boolean(user?.id),
    staleTime: 15_000,
  });

  const sendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onMutate: (candidateId) => {
      setSubmittingUserId(candidateId);
    },
    onSuccess: (_, candidateId) => {
      setOptimisticPendingIds((current) =>
        current.includes(candidateId) ? current : [...current, candidateId],
      );

      toast.success("Friend request sent", {
        description: "The user will now see your request in pending.",
      });

      void queryClient.invalidateQueries({
        queryKey: ["friends", "relationship-snapshot", user?.id],
      });
      void queryClient.invalidateQueries({
        queryKey: friendsKeys.all,
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Unable to send friend request",
      );
    },
    onSettled: () => {
      setSubmittingUserId(null);
    },
  });

  useEffect(() => {
    setPage(1);
  }, [deferredQuery]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setPage(1);
      setOptimisticPendingIds([]);
      setSubmittingUserId(null);
    }
  }, [open]);

  const users = usersQuery.data ?? [];
  const friendIds = relationshipQuery.data?.friendIds ?? [];

  const pendingIds = useMemo(
    () => [...new Set([...(relationshipQuery.data?.pendingIds ?? []), ...optimisticPendingIds])],
    [relationshipQuery.data?.pendingIds, optimisticPendingIds],
  );

  const filteredUsers = useMemo(
    () => filterUsers(users, deferredQuery, user?.id),
    [users, deferredQuery, user?.id],
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / DISCOVERY_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const visibleUsers = useMemo(
    () =>
      filteredUsers.slice(
        (currentPage - 1) * DISCOVERY_PAGE_SIZE,
        currentPage * DISCOVERY_PAGE_SIZE,
      ),
    [filteredUsers, currentPage],
  );

  const combinedError = usersQuery.error ?? relationshipQuery.error;
  const isLoading = usersQuery.isLoading || relationshipQuery.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FriendsDialogShell
        title="Add Friend"
        contentClassName="sm:max-w-4xl"
        bodyClassName="flex min-h-0 max-h-[calc(85vh-88px)] flex-col gap-4 px-6 py-5"
      >
        <div className="relative shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by username or email..."
            className="pl-10"
          />
        </div>

        <div className="shrink-0 flex items-center justify-between text-sm text-slate-400">
          <span>{filteredUsers.length} users</span>
          <span>
            Page {currentPage} / {totalPages}
          </span>
        </div>

        <div className="max-h-[26rem] overflow-y-auto pr-1">
          <AddFriendList
            visibleUsers={visibleUsers}
            friendIds={friendIds}
            pendingIds={pendingIds}
            submittingUserId={submittingUserId}
            isLoading={isLoading}
            error={combinedError}
            onSendRequest={(candidateId) => sendRequestMutation.mutate(candidateId)}
          />
        </div>

        <FriendsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </FriendsDialogShell>
    </Dialog>
  );
}
