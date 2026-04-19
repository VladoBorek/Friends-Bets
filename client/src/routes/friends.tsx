// client/src/routes/friends.tsx
import { createFileRoute } from "@tanstack/react-router";
import { friendsSearchSchema } from "../features/friends/friends-search";
import { FriendsPage } from "../pages/friends/friends-page";

export const Route = createFileRoute("/friends")({
  validateSearch: friendsSearchSchema,
  component: FriendsPage,
});
