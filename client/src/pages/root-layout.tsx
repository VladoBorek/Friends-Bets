import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";

const routeNavItems = [
  { to: "/", label: "Dashboard", exact: true },
  { to: "/wagers", label: "All Wagers", exact: false },
] as const;

const placeholderNavItems = [{ label: "Friends & Groups" }, { label: "Wallet" }] as const;

export function RootLayout() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = user?.roleName === "ADMIN";

  const handleLogout = async () => {
    await logout();
    await router.invalidate();
    await router.navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-cyan-500/20 bg-slate-900/85 p-4 shadow-xl shadow-cyan-950/20 backdrop-blur md:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold uppercase tracking-[0.35em] text-cyan-300/80">Gam(bl)ing With Friends</p>
            </div>

            {user && (
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex items-center justify-center rounded-md border border-slate-700 p-2 text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 md:hidden"
                aria-label={menuOpen ? "close navigation" : "open navigation"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            )}
          </div>

          {user && (
            <div className="mt-3 hidden items-center justify-between gap-3 md:flex">
              <nav className="inline-flex flex-wrap items-center gap-0.5">
                {routeNavItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-cyan-100"
                    activeProps={{
                      className:
                        "rounded-lg border border-cyan-400/35 bg-cyan-500/16 px-3 py-1.5 text-sm font-medium text-cyan-100",
                    }}
                    activeOptions={{ exact: item.exact }}
                  >
                    {item.label}
                  </Link>
                ))}
                {placeholderNavItems.map((item) => (
                  <span
                    key={item.label}
                    className="cursor-not-allowed rounded-lg border border-transparent px-3 py-1.5 text-sm text-slate-500"
                    title="Under Construction"
                  >
                    {item.label}
                  </span>
                ))}
                {isAdmin && (
                  <Link
                    to="/terminal"
                    className="rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-cyan-100"
                    activeProps={{
                      className:
                        "rounded-lg border border-cyan-400/35 bg-cyan-500/16 px-3 py-1.5 text-sm font-medium text-cyan-100",
                    }}
                    activeOptions={{ exact: true }}
                  >
                    Admin
                  </Link>
                )}
              </nav>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm font-medium text-rose-200 transition-colors hover:border-rose-400/60 hover:bg-rose-500/15 hover:text-rose-100"
              >
                Sign Out
              </button>
            </div>
          )}

          {user && menuOpen && (
            <div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 md:hidden">
              <nav className="flex flex-col gap-2">
                {routeNavItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md border border-transparent bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-cyan-100"
                    activeProps={{ className: "border-cyan-400/35 bg-cyan-500/15 text-cyan-100" }}
                    activeOptions={{ exact: item.exact }}
                  >
                    {item.label}
                  </Link>
                ))}
                {placeholderNavItems.map((item) => (
                  <span
                    key={item.label}
                    className="rounded-md border border-dashed border-slate-700 bg-slate-900/40 px-3 py-2 text-sm text-slate-500"
                  >
                    {item.label} (Under Construction)
                  </span>
                ))}
                {isAdmin && (
                  <Link
                    to="/terminal"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md border border-transparent bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-cyan-100"
                    activeProps={{ className: "border-cyan-400/35 bg-cyan-500/15 text-cyan-100" }}
                    activeOptions={{ exact: true }}
                  >
                    Admin
                  </Link>
                )}
              </nav>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition-colors hover:border-rose-400/60 hover:bg-rose-500/15 hover:text-rose-100"
              >
                Sign Out
              </button>
            </div>
          )}
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
