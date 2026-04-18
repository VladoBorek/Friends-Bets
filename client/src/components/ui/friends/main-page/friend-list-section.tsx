import type { FriendSummary } from "@pb138/shared/schemas/friends";
import { Card } from "../../card";
import { FriendDetailPanel } from "./friend-detail-panel";
import { FriendsPagination } from "../friends-pagination";
import { PersonRowCard } from "./person-row-card";

type FriendsListSectionProps = {
  friends: FriendSummary[];
  totalFriends: number;
  currentPage: number;
  totalPages: number;
  selectedFriend: FriendSummary | null;
  isRefreshing: boolean;
  onFriendSelect: (friendId: number) => void;
  onPageChange: (page: number) => void;
};

export function FriendsListSection({
  friends,
  totalFriends,
  currentPage,
  totalPages,
  selectedFriend,
  isRefreshing,
  onFriendSelect,
  onPageChange,
}: FriendsListSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{totalFriends} friends</span>
        <span>
          Page {currentPage} / {totalPages}
        </span>
      </div>

      {friends.length === 0 ? (
        <Card className="rounded-2xl border-slate-800 p-4 text-sm text-slate-400">
          No friends found.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {friends.map((friend) => {
            const isSelected = friend.id === selectedFriend?.id;

            return (
              <div key={friend.id} className="flex flex-col gap-3">
                <PersonRowCard
                  friend={friend}
                  isActive={isSelected}
                  onClick={() => onFriendSelect(friend.id)}
                />

                {isSelected ? (
                  <div className="lg:hidden">
                    <FriendDetailPanel friend={selectedFriend} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <div className="text-center text-xs text-slate-500">
          {isRefreshing ? "Refreshing..." : " "}
        </div>

        <FriendsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </section>
  );
}
