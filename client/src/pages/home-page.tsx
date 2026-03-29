import { useGetHealth } from "../api/gen/hooks";
import { Card, CardDescription, CardTitle } from "../components/ui/card";

export function HomePage() {
  const health = useGetHealth();

  return (
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
  );
}
