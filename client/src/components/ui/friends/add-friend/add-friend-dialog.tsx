import { useDeferredValue, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { friendsKeys } from "../../../../api/friends-query-options";
import {
  fetchDiscoveredUsers,
  sendFriendRequest,
} from "../../../../api/friends-discovery-api";
import { useAuth } from "../../../../lib/auth-context";
import { Dialog } from "../../dialog";
import { Input } from "../../input";
import { FriendsDialogShell } from "../dialog/friends-dialog-shell";
import { FriendsPagination } from "../friends-pagination";
import { AddFriendList } from "./add-friend-list";
import { DISCOVERY_PAGE_SIZE } from "./add-friend-dialog-utils";

type AddFriendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddFriendDialog({ open, onOpenChange }: AddFriendDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);

  const deferredQuery = useDeferredValue(query.trim());


const discoveryQuery = useQuery({
  queryKey: ["friends", "discover", user?.id, deferredQuery, page],
  queryFn: () =>
    fetchDiscoveredUsers({
      page,
      limit: DISCOVERY_PAGE_SIZE,
      query: deferredQuery,
    }),
  enabled: open && Boolean(user?.id),
  staleTime: 0,
  refetchOnMount: "always",
  placeholderData: keepPreviousData,
});
  const sendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onMutate: (candidateId) => {
      setSubmittingUserId(candidateId);
    },
    onSuccess: async () => {
      toast.success("Friend request sent", {
        description: "The user will now see your request in pending.",
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["friends", "discover", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["friend-requests", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["friend-requests-count", user?.id],
        }),
        queryClient.invalidateQueries({
          queryKey: friendsKeys.all,
        }),
      ]);
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
    }, [query]);


  useEffect(() => {
    if (!open) {
      setQuery("");
      setPage(1);
      setSubmittingUserId(null);
    }
  }, [open]);

  const discoveredUsers = discoveryQuery.data?.data ?? [];
  const pagination = discoveryQuery.data?.pagination ?? null;
    const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : page;

    useEffect(() => {
    if (!pagination) {
        return;
    }

    if (page > totalPages) {
        setPage(totalPages);
    }
    }, [page, totalPages, pagination]);

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
          <span>{pagination?.total ?? 0} users</span>
          <span>
            Page {page} / {totalPages}
          </span>
        </div>

        <div className="max-h-[26rem] overflow-y-auto pr-1">
          <AddFriendList
            visibleUsers={discoveredUsers}
            submittingUserId={submittingUserId}
            isLoading={discoveryQuery.isLoading}
            error={discoveryQuery.error}
            onSendRequest={(candidateId) => sendRequestMutation.mutate(candidateId)}
          />
        </div>

        <FriendsPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </FriendsDialogShell>
    </Dialog>
  );
}
