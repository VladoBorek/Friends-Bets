import { Card } from "../../components/ui/card";
import { AddFriendDialog } from "../../features/friends/components/add-friend/add-friend-dialog";
import { FriendDetailPanel } from "../../features/friends/components/main-page/friend-detail-panel";
import { FriendsListSection } from "../../features/friends/components/main-page/friend-list-section";
import { FriendsPageHeader } from "../../features/friends/components/main-page/friends-page-header";
import { PendingRequestsDialog } from "../../features/friends/components/pending-requests/pending-request-dialog";
import { FriendsPageErrorState } from "../../features/friends/components/friends-page-error-state";
import { FriendsPageSkeleton } from "../../features/friends/components/friends-page-skeleton";
import { useFriendsPage } from "../../features/friends/hooks/use-friends-page";

export function FriendsPage() {
  const page = useFriendsPage();

  if (page.friendsQuery.isLoading) {
    return <FriendsPageSkeleton />;
  }

  if (page.friendsQuery.error) {
    return (
      <FriendsPageErrorState
        message={page.friendsQuery.error instanceof Error ? page.friendsQuery.error.message : "Unknown error"}
        onRetry={() => void page.friendsQuery.refetch()}
      />
    );
  }

  if (!page.pagination) {
    return (
      <Card className="rounded-2xl border-slate-800 p-6 text-sm text-slate-400">
        Friends data is unavailable.
      </Card>
    );
  }

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6 overflow-x-hidden">
      <FriendsPageHeader
        hasIncomingRequests={page.hasIncomingRequests}
        incomingRequestCount={page.incomingRequestCount}
        onPendingClick={() => page.setIsPendingDialogOpen(true)}
        onAddFriendClick={() => page.setIsAddFriendDialogOpen(true)}
      />

      <div className="grid min-w-0 max-w-full gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <FriendsListSection
          friends={page.friends}
          totalFriends={page.pagination.total}
          currentPage={page.search.page}
          totalPages={page.totalPages}
          selectedFriend={page.selectedFriend}
          isRefreshing={page.friendsQuery.isFetching}
          onFriendSelect={page.handleFriendSelect}
          onPageChange={page.handlePageChange}
        />

        <section className="hidden min-w-0 lg:block">
          <FriendDetailPanel friend={page.selectedFriend} />
        </section>
      </div>

      <AddFriendDialog open={page.isAddFriendDialogOpen} onOpenChange={page.setIsAddFriendDialogOpen} />
      <PendingRequestsDialog open={page.isPendingDialogOpen} onOpenChange={page.setIsPendingDialogOpen} />
    </div>
  );
}