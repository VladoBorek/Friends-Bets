import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { AlertCircle, Menu, User, X } from "lucide-react";
import { useState } from "react";
import { userActionResponseSchema } from "@pb138/shared/schemas/user";
import { readJsonOrThrow } from "../api/http";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";
import { formatCurrency } from "../features/wagers/utils/utils";
import { useWalletOverview } from "../api/wallet/wallet-query-options";
import { cn } from "../lib/utils";

const routeNavItems = [
  { to: "/", label: "Dashboard", exact: true },
  { to: "/wagers", label: "All Wagers", exact: false },
  { to: "/friends", label: "Friends", exact: false },
  { to: "/groups", label: "Groups", exact: true },
  { to: "/wallet", label: "Wallet", exact: true },
] as const;

export function RootRouteComponent() {
  const location = useLocation();
  const publicPaths = new Set([
    "/auth/login",
    "/auth/register",
    "/auth/verify-email",
    "/auth/reset-password",
  ]);
  const isPublic = publicPaths.has(location.pathname);

  if (isPublic) {
    return <Outlet />;
  }

  return <RootLayout />;
}

export function RootLayout() {
  const { user, refreshUser } = useAuth();
  const walletOverview = useWalletOverview(user?.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const isAdmin = user?.roleName === "ADMIN";
  const isVerified = user?.isVerified ?? false;

  const renderWalletBalance = () => {
    if (walletOverview.isLoading) {
      return (
        <div className="inline-flex items-center rounded-lg border border-transparent px-3 py-1.5 text-sm">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-800/80" />
        </div>
      );
    }

    if (walletOverview.error || !walletOverview.data?.data) {
      return (
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300">
          <AlertCircle className="h-4 w-4" />
          <span>{formatCurrency(0)}</span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center rounded-lg border border-cyan-400/35 bg-cyan-500/16 px-3 py-1.5 text-sm font-medium text-cyan-100">
        <span>Balance</span>
        <span className="ml-1.5 tabular-nums text-cyan-200">{formatCurrency(walletOverview.data.data.balance)}</span>
      </div>
    );
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setIsResendLoading(true);

    try {
      const res = await fetch("/api/users/resend-verification", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const json = userActionResponseSchema.parse(
        await readJsonOrThrow(res, "Failed to resend verification email."),
      );

      setFeedback({ type: "success", message: json.data.message });
      await refreshUser();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to resend verification email.",
      });
    } finally {
      setIsResendLoading(false);
    }
  };

  const userSettingsButtonClassName =
    "inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-700 text-slate-100 transition-colors hover:bg-slate-600";

  return (
    <div className="isolate min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="app-glow-surface mb-8 rounded-2xl border border-cyan-500/20 bg-slate-900/85 p-4 backdrop-blur md:p-5">
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

          <div className="flex items-start justify-between gap-4">
            <p className="text-lg font-bold tracking-[0.35em] text-cyan-300/80">BetPals</p>

            {user && (
              <div className="inline-flex items-center gap-2">
                <span className="max-w-[10rem] truncate text-sm font-semibold text-slate-200 sm:max-w-[14rem]">
                  {user.username}
                </span>

                <Link
                  to="/profile"
                  aria-label="User Settings"
                  title="User Settings"
                  className={userSettingsButtonClassName}
                  activeProps={{
                    className: cn(userSettingsButtonClassName, "border-cyan-400/35 bg-cyan-500/16 text-cyan-100"),
                  }}
                  activeOptions={{ exact: true }}
                >
                  <User className="h-4 w-4" />
                </Link>

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
              </div>
            )}
          </div>

          {user && (
            <div className="mt-8 hidden items-center justify-between gap-3 md:flex">
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
                    activeOptions={{ exact: item.exact, includeSearch: false }}
                  >
                    {item.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    to="/terminal"
                    className="rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-cyan-100"
                    activeProps={{
                      className:
                        "rounded-lg border border-cyan-400/35 bg-cyan-500/16 px-3 py-1.5 text-sm font-medium text-cyan-100",
                    }}
                    activeOptions={{ exact: true, includeSearch: false }}
                  >
                    Admin
                  </Link>
                )}
              </nav>

              <div className="inline-flex items-center gap-2">
                {renderWalletBalance()}

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
                    activeOptions={{ exact: item.exact, includeSearch: false }}
                  >
                    {item.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    to="/terminal"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md border border-transparent bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-cyan-100"
                    activeProps={{ className: "border-cyan-400/35 bg-cyan-500/15 text-cyan-100" }}
                    activeOptions={{ exact: true, includeSearch: false }}
                  >
                    Admin
                  </Link>
                )}
              </nav>

              <div className="flex flex-col items-start gap-2">
                {renderWalletBalance()}

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
              </div>
            </div>
          )}
        </header>

        <main className="min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}