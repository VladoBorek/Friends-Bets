import { createFileRoute } from "@tanstack/react-router";
import { friendWagersSearchSchema } from "../features/friends/friend-wagers-search";
import { FriendSharedWagersPage } from "../pages/friends/friend-shared-wagers-page";

export const Route = createFileRoute("/friends_/$friendId/wagers")({
  validateSearch: friendWagersSearchSchema,
  component: FriendSharedWagersPage,
});
