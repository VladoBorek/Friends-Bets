import { Link, useRouter } from "@tanstack/react-router";
import { Menu, User, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { cn } from "../../lib/utils";
import { Button } from "../ui/utils/button";

const routeNavItems = [
  { to: "/", label: "Dashboard", exact: true },
  { to: "/wagers", label: "All Wagers", exact: false },
  { to: "/friends", label: "Friends", exact: false },
  { to: "/groups", label: "Groups", exact: true },
  { to: "/wallet", label: "Wallet", exact: true },
] as const;

export function Navbar() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isResendLoading, setIsResendLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (!user) return null;

  const isAdmin = user.roleName === "ADMIN";
  const isVerified = user.isVerified ?? false;

  const handleLogout = async () => {
    await logout();
    await router.invalidate();
    await router.navigate({ to: "/auth/login" });
  };

  const handleResendVerification = async () => {
    if (!user.email) return;
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

  const userSettingsButtonClassName =
    "inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-700 text-slate-100 transition-colors hover:bg-slate-600";

  return (
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-bold uppercase tracking-[0.35em] text-cyan-300/80">Gam(bl)ing With Friends</p>
        </div>

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
          <Link
            to="/profile"
            aria-label="User Settings"
            title="User Settings"
            className={userSettingsButtonClassName}
            activeProps={{
              className: cn(userSettingsButtonClassName, "border-cyan-400/35 bg-cyan-500/16 text-cyan-100"),
            }}
            activeOptions={{ exact: true, includeSearch: false }}
          >
            <User className="h-4 w-4" />
          </Link>
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

      {menuOpen && (
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                aria-label="User Settings"
                title="User Settings"
                onClick={() => setMenuOpen(false)}
                className={cn(userSettingsButtonClassName, "shrink-0")}
                activeProps={{
                  className: cn(
                    userSettingsButtonClassName,
                    "shrink-0 border-cyan-400/35 bg-cyan-500/16 text-cyan-100",
                  ),
                }}
                activeOptions={{ exact: true, includeSearch: false }}
              >
                <User className="h-4 w-4" />
              </Link>
            </div>
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
  );
}
