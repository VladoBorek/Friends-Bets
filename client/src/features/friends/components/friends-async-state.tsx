import type { ReactNode } from "react";

type FriendsAsyncStateProps = {
  isLoading: boolean;
  error: unknown;
  isEmpty: boolean;
  emptyMessage: string;
  skeletonCount?: number;
  errorMessage?: string;
  children: ReactNode;
};

export function FriendsAsyncState({
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  skeletonCount = 4,
  errorMessage = "Something went wrong.",
  children,
}: FriendsAsyncStateProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: skeletonCount }, (_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-2xl border border-slate-800 bg-slate-950/50"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        {error instanceof Error ? error.message : errorMessage}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-10 text-center text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return <>{children}</>;
}
