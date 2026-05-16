import { useDeferredValue, useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { fetchDiscoveredUsers } from "../../../api/friends-discovery-api";
import { addGroupMember } from "../../../api/groups/group-members-api";
import { groupsKeys } from "../../../api/groups/groups-query-options";
import { useAuth } from "../../../lib/auth-context";
import { Button } from "../button";
import { Dialog } from "../dialog";
import { Input } from "../input";
import { FriendsDialogShell } from "../friends/dialog/friends-dialog-shell";
import { FriendsPagination } from "../friends/friends-pagination";

const INVITE_PAGE_SIZE = 8;

type InviteGroupMemberDialogProps = {
  groupId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InviteGroupMemberDialog({
  groupId,
  open,
  onOpenChange,
}: InviteGroupMemberDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);

  const deferredQuery = useDeferredValue(query.trim());

  const usersQuery = useQuery({
    queryKey: ["groups", "invite-users", groupId, user?.id, deferredQuery, page],
    queryFn: () =>
      fetchDiscoveredUsers({
        page,
        limit: INVITE_PAGE_SIZE,
        query: deferredQuery,
      }),
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  const inviteMutation = useMutation({
    mutationFn: (userId: number) => addGroupMember(groupId, { userId, role: "MEMBER" }),
    onMutate: (userId) => setSubmittingUserId(userId),
    onSuccess: async () => {
      toast.success("User invited");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: groupsKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["groups", "members", groupId] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to invite user"),
    onSettled: () => setSubmittingUserId(null),
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

  const users = usersQuery.data?.data ?? [];
  const pagination = usersQuery.data?.pagination ?? null;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FriendsDialogShell title="Invite User" contentClassName="sm:max-w-3xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by username or email..."
            className="pl-10"
          />
        </div>

        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>{pagination?.total ?? 0} users</span>
          <span>
            Page {page} / {totalPages}
          </span>
        </div>

        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto pr-1">
          {usersQuery.isLoading ? (
            <p className="rounded-2xl border border-slate-800 p-4 text-sm text-slate-400">
              Loading users...
            </p>
          ) : usersQuery.isError ? (
            <p className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
              {usersQuery.error instanceof Error ? usersQuery.error.message : "Unable to load users."}
            </p>
          ) : users.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-800 p-4 text-sm text-slate-400">
              No users found.
            </p>
          ) : (
            users.map((candidate) => (
              <div
                key={candidate.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/45 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{candidate.username}</p>
                  <p className="truncate text-xs text-slate-500">{candidate.email}</p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={submittingUserId === candidate.id}
                  onClick={() => inviteMutation.mutate(candidate.id)}
                >
                  {submittingUserId === candidate.id ? "Inviting..." : "Invite"}
                </Button>
              </div>
            ))
          )}
        </div>

        <FriendsPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </FriendsDialogShell>
    </Dialog>
  );
}