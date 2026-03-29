import { Link } from "@tanstack/react-router";
import { useListWagers } from "../api/gen/hooks";
import { Card, CardDescription, CardTitle } from "../components/ui/card";

export function WagersPage() {
  const wagers = useListWagers();

  if (wagers.isLoading) {
    return <p className="text-slate-300">Loading wagers...</p>;
  }

  if (wagers.error) {
    return <p className="text-rose-300">Unable to load wagers.</p>;
  }

  if (!wagers.data?.data.length) {
    return <p className="text-slate-300">No wagers found. Seed the database and create your first wager.</p>;
  }

  return (
    <div className="grid gap-4">
      {wagers.data.data.map((wager) => (
        <Card key={wager.id} className="transition-colors hover:border-cyan-500/40">
          <CardTitle>{wager.title}</CardTitle>
          <CardDescription className="mt-2">
            {wager.description ?? "No description"}
          </CardDescription>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="rounded-full border border-slate-700 px-2 py-1">{wager.status}</span>
            <span>Category: {wager.categoryName}</span>
            <span>Creator: {wager.creatorName}</span>
          </div>
          <Link
            to="/wagers/$wagerId"
            params={{ wagerId: String(wager.id) }}
            className="mt-4 inline-flex text-sm text-cyan-300 transition-colors hover:text-cyan-200"
          >
            Open detail
          </Link>
        </Card>
      ))}
    </div>
  );
}
