import { Link, Outlet } from "@tanstack/react-router";

const navItems = [
  { to: "/", label: "Overview" },
  { to: "/wagers", label: "Wagers" },
  { to: "/wagers/new", label: "Create" },
] as const;

export function RootLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 p-6 shadow-xl shadow-cyan-950/20">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">PB138</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Wager API Control Panel</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            SPA frontend powered by TanStack Router + Query, consuming generated Kubb REST hooks.
          </p>
          <nav className="mt-5 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200"
                activeProps={{ className: "border-cyan-400 bg-cyan-500/10 text-cyan-200" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
