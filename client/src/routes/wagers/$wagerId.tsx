import { createFileRoute } from "@tanstack/react-router";
import { WagerDetailPage } from "../../pages/wager-detail-page";

export const Route = createFileRoute("/wagers/$wagerId")({
  component: function WagerDetailRoute() {
    const { wagerId } = Route.useParams();
    const parsedWagerId = Number(wagerId);

    if (!Number.isInteger(parsedWagerId) || parsedWagerId <= 0) {
      return <p className="text-rose-300">Invalid wager id.</p>;
    }

    return <WagerDetailPage wagerId={parsedWagerId} />;
  },
});
