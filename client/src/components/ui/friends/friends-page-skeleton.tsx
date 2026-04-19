// client/src/features/friends/components/friends-page-skeleton.tsx
export function FriendsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="h-8 w-40 rounded bg-slate-800" />
        <div className="mt-2 h-4 w-72 rounded bg-slate-800" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <section className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[76px] rounded-2xl border border-slate-800 bg-slate-900/60" />
          ))}
        </section>

        <section>
          <div className="min-h-[320px] rounded-2xl border border-slate-800 bg-slate-900/60" />
        </section>
      </div>
    </div>
  );
}
