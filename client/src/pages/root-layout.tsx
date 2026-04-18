import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { fa } from "zod/locales";

const routeNavItems = [
  { to: "/", label: "Dashboard", exact: true },
  { to: "/wagers", label: "All Wagers", exact: false },
  { to: "/friends", label: "Friends", exact: false },
] as const;

const placeholderNavItems = [{ label: "Friends & Groups" }, { label: "Wallet" }] as const;

export function RootLayout() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const isAdmin = user?.roleName === "ADMIN";
  const isVerified = user?.isVerified ?? false;

  const handleLogout = async () => {
    await logout();
    await router.invalidate();
    await router.navigate({ to: "/login" });
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setIsResendLoading(true);
    try {
      const res = await fetch("/api/users/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const json = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        setFeedback({ type: "error", message: json?.message ?? "Failed to resend verification email." });
        return;
      }
      setFeedback({ type: "success", message: json?.message ?? "Verification email resent." });
      await refreshUser();
    } finally {
      setIsResendLoading(false);
    }
  };

  return (
    <div className="isolate min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-cyan-500/20 bg-slate-900/85 p-4 shadow-xl shadow-cyan-950/20 backdrop-blur md:p-5">
          {feedback && (
            <div
              className={`mb-4 rounded-lg p-3 text-sm ring-1 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25"
                  : "bg-rose-500/10 text-rose-300 ring-rose-500/25"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{feedback.message}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeedback(null)}
                  className="h-auto px-1.5 py-0.5 text-xs text-slate-300 hover:bg-slate-800/60"
                >
                  close
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold uppercase tracking-[0.35em] text-cyan-300/80">Gam(bl)ing With Friends</p>
            </div>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen((open) => !open)}
                className="md:hidden"
                aria-label={menuOpen ? "close navigation" : "open navigation"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
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

              <div className="inline-flex items-center gap-2">
                {!isVerified && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={isResendLoading}
                    className="border-amber-500/35 bg-amber-500/10 text-amber-200 hover:border-amber-400/70 hover:bg-amber-500/15 hover:text-amber-100"
                  >
                    {isResendLoading ? "Resending..." : "Resend Verification"}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  className="border-rose-500/30 bg-rose-500/10 text-rose-200 hover:border-rose-400/60 hover:bg-rose-500/15 hover:text-rose-100"
                >
                  Sign Out
                </Button>
              </div>
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
              <div className="flex flex-col gap-2">
                {!isVerified && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={isResendLoading}
                    className="w-full border-amber-500/35 bg-amber-500/10 text-amber-200 hover:border-amber-400/70 hover:bg-amber-500/15 hover:text-amber-100"
                  >
                    {isResendLoading ? "Resending..." : "Resend Verification"}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full border-rose-500/30 bg-rose-500/10 text-rose-200 hover:border-rose-400/60 hover:bg-rose-500/15 hover:text-rose-100"
                >
                  Sign Out
                </Button>
              </div>
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
