import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { useAuth } from "../lib/auth-context";

const navItems = [
  { to: "/", label: "Overview" },
  { to: "/wagers", label: "Wagers" },
  { to: "/wagers/new", label: "Create" },
] as const;

export function RootLayout() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = user?.roleName === "ADMIN";

  const handleLogout = async () => {
    await logout();
    router.invalidate();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 p-6 shadow-xl shadow-cyan-950/20">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">PB138</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Wager API Control Panel</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">
            SPA frontend powered by TanStack Router + Query, consuming generated Kubb REST hooks.
          </p>
          <div className="mt-5 flex items-center justify-between gap-3">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200"
                  activeProps={{ className: "border-cyan-400 bg-cyan-500/10 text-cyan-200" }}
                  activeOptions={{ exact: true }}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/terminal"
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200"
                  activeProps={{ className: "border-cyan-400 bg-cyan-500/10 text-cyan-200" }}
                  activeOptions={{ exact: true }}
                >
                  Terminal
                </Link>
              )}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-rose-500/30 px-3 py-1.5 text-sm font-medium text-rose-300 transition-colors hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-200"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
