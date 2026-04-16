import { useGetHealth } from "../api/gen/hooks";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import { useSearch } from "@tanstack/react-router";
import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

export function HomePage() {
  const health = useGetHealth();
  const search = useSearch({ from: "/" });
  const [showVerifiedPopup, setShowVerifiedPopup] = useState(false);

  useEffect(() => {
    setShowVerifiedPopup(search.verified === "1");
  }, [search.verified]);

  return (
    <div className="space-y-4">
      {showVerifiedPopup && (
        <div className="relative rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-4 shadow-lg shadow-emerald-950/20">
          <button
            type="button"
            onClick={() => setShowVerifiedPopup(false)}
            className="absolute right-3 top-3 inline-flex rounded-md p-1 text-emerald-200/80 transition-colors hover:bg-emerald-500/15 hover:text-emerald-100"
            aria-label="close verification popup"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-emerald-200">Email Verified</p>
              <p className="mt-1 text-sm text-emerald-100/90">Your account is now verified and ready for full access.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle>Client-Server Architecture</CardTitle>
          <CardDescription className="mt-2">
            Backend is served by Elysia REST endpoints with Drizzle ORM. Client API types and hooks are generated from OpenAPI
            with Kubb and consumed through TanStack Query.
          </CardDescription>
        </Card>

        <Card>
          <CardTitle>API Health</CardTitle>
          <CardDescription className="mt-2">
            {health.isLoading && "Checking API status..."}
            {health.error && "Health check failed. Ensure the API server is running on port 3000."}
            {health.data && `Status: ${health.data.status} (${health.data.service})`}
          </CardDescription>
        </Card>
      </div>
    </div>
  );
}
