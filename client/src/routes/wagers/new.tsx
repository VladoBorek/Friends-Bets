import { createFileRoute } from "@tanstack/react-router";
import { NewWagerPage } from "../../pages/new-wager-page";

export const Route = createFileRoute("/wagers/new")({
  component: NewWagerPage,
});
