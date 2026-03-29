import { Link } from "@tanstack/react-router";
import { useGetWagerById } from "../api/gen/hooks";
import { Card, CardDescription, CardTitle } from "../components/ui/card";

type WagerDetailPageProps = {
  wagerId: number;
};

export function WagerDetailPage({ wagerId }: WagerDetailPageProps) {
  const wager = useGetWagerById(wagerId);

  if (wager.isLoading) {
    return <p className="text-slate-300">Loading wager detail...</p>;
  }

  if (wager.error || !wager.data?.data) {
    return <p className="text-rose-300">Wager not found.</p>;
  }

  const detail = wager.data.data;

  return (
    <div className="grid gap-4">
      <Card>
        <CardTitle>{detail.title}</CardTitle>
        <CardDescription className="mt-2">{detail.description ?? "No description"}</CardDescription>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
          <span className="rounded-full border border-slate-700 px-2 py-1">{detail.status}</span>
          <span>Category: {detail.categoryName}</span>
          <span>Creator: {detail.creatorName}</span>
        </div>
      </Card>

      <Card>
        <CardTitle>Outcomes</CardTitle>
        <div className="mt-4 grid gap-2">
          {detail.outcomes.map((outcome) => (
            <div key={outcome.id} className="flex items-center justify-between rounded-md border border-slate-700 p-3">
              <p>{outcome.title}</p>
              <p className="text-sm text-slate-300">odds: {outcome.odds ?? "n/a"}</p>
            </div>
          ))}
        </div>
      </Card>

      <Link to="/wagers" className="text-sm text-cyan-300 transition-colors hover:text-cyan-200">
        Back to list
      </Link>
    </div>
  );
}
