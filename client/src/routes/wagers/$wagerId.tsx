import { createFileRoute } from "@tanstack/react-router";
import { WagerDetailPage } from "../../pages/wager-detail-page";

export const Route = createFileRoute("/wagers/$wagerId")({
  component: function WagerDetailRoute() {
    const { wagerId } = Route.useParams();

    return <WagerDetailPage wagerId={Number(wagerId)} />;
  },
});
