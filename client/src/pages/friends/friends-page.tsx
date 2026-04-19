import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "../../components/ui/card";
import { FriendDetailPanel } from "../../components/ui/friends/main-page/friend-detail-panel";
import { FriendsPageErrorState } from "../../components/ui/friends/friends-page-error-state";
import { FriendsPageSkeleton } from "../../components/ui/friends/friends-page-skeleton";
import { friendsQueries } from "../../api/friends-query-options";
import { Route } from "../../routes/friends";
import { FriendsListSection } from "../../components/ui/friends/main-page/friend-list-section";
import { useMediaQuery } from "../../features/friends/use-media-query";
import { Button } from "../../components/ui/button";
import { UserPlus, Clock3 } from "lucide-react";
import { AddFriendDialog } from "../../components/ui/friends/add-friend/add-friend-dialog";
import { PendingRequestsDialog } from "../../components/ui/friends/pending-requests/pending-request-dialog";
import { fetchFriendRequestCount } from "../../api/friends-discovery-api";
import { useAuth } from "../../lib/auth-context";

export function FriendsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const { user } = useAuth();

  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [isAddFriendDialogOpen, setIsAddFriendDialogOpen] = useState(false);
  const [isPendingDialogOpen, setIsPendingDialogOpen] = useState(false);

  const friendsQuery = useQuery(friendsQueries.list(search.page));

  const friends = friendsQuery.data?.data ?? [];
  const pagination = friendsQuery.data?.pagination ?? null;
  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) ?? null;

  const incomingRequestsQuery = useQuery({
    queryKey: ["friend-requests-count", user?.id, "incoming"],
    queryFn: () => fetchFriendRequestCount("incoming"),
    enabled: Boolean(user?.id),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const incomingRequestCount = incomingRequestsQuery.data ?? 0;
  const hasIncomingRequests = incomingRequestCount > 0;

  useEffect(() => {
    if (!friends.length) {
      setSelectedFriendId(null);
      return;
    }

    const selectedStillExists = friends.some((friend) => friend.id === selectedFriendId);

    if (selectedStillExists) {
      return;
    }

    if (isDesktop) {
      setSelectedFriendId(friends[0].id);
      return;
    }

    setSelectedFriendId(null);
  }, [friends, isDesktop, selectedFriendId]);

  const handleFriendSelect = (friendId: number) => {
    setSelectedFriendId((currentId) => {
      if (isDesktop) {
        return friendId;
      }

      return currentId === friendId ? null : friendId;
    });
  };

  const handlePageChange = (page: number) => {
    void navigate({
      to: "/friends",
      search: { page },
    });
  };

  if (friendsQuery.isLoading) {
    return <FriendsPageSkeleton />;
  }

  if (friendsQuery.error) {
    return (
      <FriendsPageErrorState
        message={friendsQuery.error instanceof Error ? friendsQuery.error.message : "Unknown error"}
        onRetry={() => void friendsQuery.refetch()}
      />
    );
  }

  if (!pagination) {
    return (
      <Card className="rounded-2xl border-slate-800 p-6 text-sm text-slate-400">
        Friends data is unavailable.
      </Card>
    );
  }

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Friends</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsPendingDialogOpen(true)}
            className="relative gap-2 border border-slate-700 bg-slate-800/70 text-slate-100 hover:bg-slate-800"
          >
            <Clock3 className="h-4 w-4" />
            Pending

            {hasIncomingRequests ? (
              <>
                <span className="absolute -right-1.5 -top-1.5 size-3 rounded-full border border-slate-950 bg-rose-500" />
                <span className="sr-only">
                  {incomingRequestCount} pending incoming friend request
                  {incomingRequestCount === 1 ? "" : "s"}
                </span>
              </>
            ) : null}
          </Button>

          <Button
            onClick={() => setIsAddFriendDialogOpen(true)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Friend
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <FriendsListSection
          friends={friends}
          totalFriends={pagination.total}
          currentPage={search.page}
          totalPages={totalPages}
          selectedFriend={selectedFriend}
          isRefreshing={friendsQuery.isFetching}
          onFriendSelect={handleFriendSelect}
          onPageChange={handlePageChange}
        />

        <section className="hidden lg:block">
          <FriendDetailPanel friend={selectedFriend} />
        </section>
      </div>

      <AddFriendDialog
        open={isAddFriendDialogOpen}
        onOpenChange={setIsAddFriendDialogOpen}
      />

      <PendingRequestsDialog
        open={isPendingDialogOpen}
        onOpenChange={setIsPendingDialogOpen}
      />
    </div>
  );
}
