import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { friendsQueries } from "../../api/friends-query-options";
import { Card, CardDescription, CardTitle } from "../../components/ui/card";
import { FriendsPagination } from "../../components/ui/friends/friends-pagination";
import type { FriendWagerSummary } from "@pb138/shared/schemas/friends";
import { Route } from "../../routes/friends_.$friendId.wagers"
import { cn } from "../../lib/utils";
function formatSignedMoney(value: string) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}

function getMoneyTone(value: string) {
  const numericValue = Number(value);

  if (numericValue > 0) return "text-emerald-300";
  if (numericValue < 0) return "text-rose-300";
  return "text-slate-200";
}

function getHeadToHeadMeta(result: FriendWagerSummary["headToHeadResult"]) {
  if (result === "WIN") {
    return {
      label: "YOU WON",
      className: "border-emerald-500/30 text-emerald-300",
    };
  }

  if (result === "LOSS") {
    return {
      label: "YOU LOST",
      className: "border-rose-500/30 text-rose-300",
    };
  }

  return {
    label: "DRAW",
    className: "border-amber-500/30 text-amber-300",
  };
}

export function FriendSharedWagersPage() {
  const { friendId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const parsedFriendId = Number(friendId);
  const isValidFriendId = Number.isInteger(parsedFriendId) && parsedFriendId > 0;

  const detailQuery = useQuery({
    ...friendsQueries.detail(parsedFriendId),
    enabled: isValidFriendId,
  });

  const historyQuery = useQuery({
    ...friendsQueries.wagerHistory(parsedFriendId, search.page),
    enabled: isValidFriendId,
  });

  if (!isValidFriendId) {
    return <p className="text-rose-300">Invalid friend id.</p>;
  }

  if (detailQuery.isLoading || historyQuery.isLoading) {
    return <p className="text-slate-300">Loading shared wagers...</p>;
  }

  if (detailQuery.error) {
    return <p className="text-rose-300">{detailQuery.error instanceof Error ? detailQuery.error.message : "Unable to load friend."}</p>;
  }

  if (historyQuery.error) {
    return <p className="text-rose-300">{historyQuery.error instanceof Error ? historyQuery.error.message : "Unable to load shared wager history."}</p>;
  }

  const friend = detailQuery.data?.data.friend ?? historyQuery.data?.friend;
  const wagers = historyQuery.data?.data ?? [];
  const pagination = historyQuery.data?.pagination;
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.limit)) : 1;

  if (!friend) {
    return <p className="text-slate-300">Friend not found.</p>;
  }

  const handlePageChange = (page: number) => {
    void navigate({
      to: "/friends/$friendId/wagers",
      params: { friendId: String(parsedFriendId) },
      search: { page },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/friends"
            search={{ page: 1 }}
            className="inline-flex items-center gap-2 text-sm text-cyan-300 transition-colors hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to friends
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-slate-100">
            Shared Wagers with {friend.username}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Full head-to-head wager history between you and {friend.username}.
          </p>
        </div>
      </div>

      {wagers.length === 0 ? (
        <Card className="rounded-2xl border-slate-800 p-6 text-sm text-slate-400">
          No shared wagers found.
        </Card>
      ) : (
        <div className="grid gap-4">
          {wagers.map((wager) => (
            <Link
              key={wager.wagerId}
              to="/wagers/$wagerId"
              params={{ wagerId: String(wager.wagerId) }}
              className="block"
            >
              <Card className="cursor-pointer rounded-2xl border-slate-800 transition-colors hover:border-cyan-500/35">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle>{wager.title}</CardTitle>
                    <CardDescription className="mt-2">
                      You: {wager.currentUserOutcomeTitle ?? "n/a"} · Them: {wager.friendOutcomeTitle ?? "n/a"}
                    </CardDescription>
                  </div>

                  <div className={`shrink-0 text-lg font-semibold ${getMoneyTone(wager.currentUserNetPnl)}`}>
                    {formatSignedMoney(wager.currentUserNetPnl)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  {wager.headToHeadResult ? (() => {
                    const resultMeta = getHeadToHeadMeta(wager.headToHeadResult);

                    return (
                        <span className={cn("rounded-full border px-2 py-1", resultMeta.className)}>
                        {resultMeta.label}
                        </span>
                    );
                    })() : null}

                  <span className="rounded-full border border-slate-700 px-2 py-1">
                    Your bet: {formatSignedMoney(wager.currentUserBetAmount)}
                  </span>
                  <span className="rounded-full border border-slate-700 px-2 py-1">
                    Their bet: {formatSignedMoney(wager.friendBetAmount)}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pagination ? (
        <FriendsPagination
          currentPage={search.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      ) : null}
    </div>
  );
}
