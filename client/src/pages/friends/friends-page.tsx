import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "../../components/ui/card";
import { FriendDetailPanel } from "../../components/ui/friends/friend-detail-panel";
import { FriendsPageErrorState } from "../../components/ui/friends/friends-page-error-state";
import { FriendsPageSkeleton } from "../../components/ui/friends/friends-page-skeleton";
import { friendsQueries } from "../../api/friends-query-options";
import { Route } from "../../routes/friends";
//import { FriendsListSection } from "client/src/components/ui/friends/friend-list-section";
import { FriendsListSection } from "../../components/ui/friends/friend-list-section"


export function FriendsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const friendsQuery = useQuery(friendsQueries.list(search.page));

  const friends = friendsQuery.data?.data ?? [];
  const pagination = friendsQuery.data?.pagination ?? null;
  const selectedFriend = friends.find((friend) => friend.id === search.friendId) ?? null;

  useEffect(() => {
    if (!friends.length) return;
    if (selectedFriend) return;

    void navigate({
      search: (prev) => ({
        ...prev,
        friendId: friends[0].id,
      }),
      replace: true,
    });
  }, [friends, navigate, selectedFriend]);

  const handleFriendSelect = (friendId: number) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        friendId,
      }),
      replace: true,
    });
  };

  const handlePageChange = (page: number) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        page,
        friendId: undefined,
      }),
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
      
      <div>
          <h1 className="text-2xl font-semibold text-slate-100">Friends</h1>
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
    </div>
  );
}
