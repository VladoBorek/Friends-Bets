import { createFileRoute } from "@tanstack/react-router";
import { groupsSearchSchema } from "../features/groups/groups-search";
import { GroupsPage } from "../pages/groups/groups-page";

export const Route = createFileRoute("/groups")({
  validateSearch: groupsSearchSchema,
  component: GroupsPage,
});