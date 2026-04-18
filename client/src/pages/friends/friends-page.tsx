    // client/src/features/friends/pages/friends-page.tsx
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Route } from "../../routes/friends";
import { friendsQueries } from "../../api/friends-query-options";
import { FriendDetailPanel } from "../../components/ui//friends/friend-detail-panel";
import { FriendsPageErrorState } from "../../components/ui//friends/friends-page-error-state";
import { FriendsPageSkeleton } from "../../components/ui//friends/friends-page-skeleton";
import { PersonRowCard } from "../../components/ui//friends/person-row-card";

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
        <p className="mt-1 text-sm text-slate-400">Base paginated list with a placeholder summary panel.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{pagination.total} friends</span>
            <span>
              Page {search.page} / {totalPages}
            </span>
          </div>

          {friends.length === 0 ? (
            <Card className="rounded-2xl border-slate-800 p-4 text-sm text-slate-400">
              No friends found.
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {friends.map((friend) => (
                <PersonRowCard
                  key={friend.id}
                  friend={friend}
                  isActive={friend.id === selectedFriend?.id}
                  onClick={() =>
                    void navigate({
                      search: (prev) => ({
                        ...prev,
                        friendId: friend.id,
                      }),
                      replace: true,
                    })
                  }
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={search.page <= 1}
              onClick={() =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    page: prev.page - 1,
                    friendId: undefined,
                  }),
                })
              }
            >
              Previous
            </Button>

            <div className="text-xs text-slate-500">
              {friendsQuery.isFetching ? "Refreshing..." : " "}
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={!pagination.hasMore}
              onClick={() =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    page: prev.page + 1,
                    friendId: undefined,
                  }),
                })
              }
            >
              Next
            </Button>
          </div>
        </section>

        <section>
          <FriendDetailPanel friend={selectedFriend} />
        </section>
      </div>
    </div>
  );
}
