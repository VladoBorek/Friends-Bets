import type { UserSummary } from "@pb138/shared/schemas/user";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { friendsKeys } from "../../../api/friends-query-options";
import {
  fetchAllUsers,
  fetchFriendRelationshipSnapshot,
  sendFriendRequest,
} from "../../../api/friends-discovery-api";
import { useAuth } from "../../../lib/auth-context";
import { cn } from "../../../lib/utils";
import { Button } from "../button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { Input } from "../input";
import { FriendsPagination } from "./friends-pagination";

const DISCOVERY_PAGE_SIZE = 8;

type AddFriendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type RelationshipState = "add" | "request-sent" | "friends";

function getRelationshipState(
  candidateId: number,
  friendIds: number[],
  pendingIds: number[],
): RelationshipState {
  if (friendIds.includes(candidateId)) {
    return "friends";
  }

  if (pendingIds.includes(candidateId)) {
    return "request-sent";
  }

  return "add";
}

function getInitials(username: string) {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function buildButtonLabel(state: RelationshipState, isSending: boolean) {
  if (isSending) {
    return "Sending...";
  }

  if (state === "friends") {
    return "Friends";
  }

  if (state === "request-sent") {
    return "Request sent";
  }

  return "Add";
}

function filterUsers(users: UserSummary[], query: string, currentUserId?: number) {
  const normalizedQuery = query.trim().toLowerCase();

  return users
    .filter((candidate) => candidate.id !== currentUserId)
    .filter((candidate) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${candidate.username} ${candidate.email}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .sort((left, right) => left.username.localeCompare(right.username));
}

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-cyan-500/20 bg-slate-900/95 p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-slate-800 px-6 py-5">
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Search existing users and send a friend request without leaving the page.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[min(70vh,40rem)] flex-col gap-4 px-6 py-5">
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

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {usersQuery.isLoading || relationshipQuery.isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }, (_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/50"
                  />
                ))}
              </div>
            ) : combinedError ? (
              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {combinedError instanceof Error
                  ? combinedError.message
                  : "Unable to load add-friend data."}
              </div>
            ) : visibleUsers.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-10 text-center text-sm text-slate-400">
                No users match your search.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {visibleUsers.map((candidate) => {
                  const state = getRelationshipState(candidate.id, friendIds, pendingIds);
                  const isSending = submittingUserId === candidate.id;
                  const isDisabled = state !== "add" || isSending;

                  return (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-4 transition-colors hover:border-cyan-500/20 hover:bg-slate-950/70"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-sm font-semibold text-indigo-200">
                          {getInitials(candidate.username)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-100">
                            {candidate.username}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {candidate.email}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        disabled={isDisabled}
                        onClick={() => sendRequestMutation.mutate(candidate.id)}
                        title={
                          state === "friends"
                            ? "You are already friends"
                            : state === "request-sent"
                              ? "A friend request already exists"
                              : "Send friend request"
                        }
                        className={cn(
                          "min-w-28",
                          state === "friends" &&
                            "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/10",
                          state === "request-sent" &&
                            "border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/10",
                        )}
                      >
                        {state === "add" && !isSending ? (
                          <>
                            <UserPlus className="mr-1 h-4 w-4" />
                            Add
                          </>
                        ) : (
                          buildButtonLabel(state, isSending)
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-800 pt-3">
            <FriendsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
