import { createFileRoute } from "@tanstack/react-router";
import { WagersPage } from "../../pages/wagers-page";

export const Route = createFileRoute("/wagers/")({
  component: WagersPage,
});
