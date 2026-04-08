import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  useEffect(() => {
    setUsername("");
    setEmail("");
    setPassword("");
    setRepeatPassword("");
    setError("");
    setSuccess("");
    setShowPassword(false);
    setShowRepeatPassword(false);
  }, [location.href]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== repeatPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      if (!res.ok) {
        throw new Error(data?.message ?? "Registration failed.");
      }

      await refreshUser();
      setSuccess("Account created. You are now signed in. Please verify your email.");
      window.setTimeout(() => {
        void navigate({ to: "/" });
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/20 bg-slate-900 p-8 text-slate-100 shadow-xl shadow-cyan-950/20">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 inline-flex rounded-full bg-cyan-950/50 p-3 ring-1 ring-cyan-500/30">
            <UserPlus className="h-6 w-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Create Account</h1>
          <p className="mt-2 text-sm text-slate-400">Register now. Verification email will be sent.</p>
        </div>

        {error && <div className="mb-6 rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 ring-1 ring-rose-500/20">{error}</div>}
        {success && (
          <div className="mb-6 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-300 ring-1 ring-emerald-500/20">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="username">
              Username
            </label>
            <input
              key={`register-username-${location.href}`}
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              className="w-full rounded-md border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-slate-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
              placeholder="your-name"
              minLength={3}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
              Email Address
            </label>
            <input
              key={`register-email-${location.href}`}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-md border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-slate-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                key={`register-password-${location.href}`}
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-md border border-slate-700 bg-slate-950/50 px-4 py-2.5 pr-11 text-slate-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                placeholder="••••••••"
                minLength={4}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-400 transition-colors hover:text-cyan-200"
                aria-label={showPassword ? "hide password" : "show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="repeatPassword">
              Repeat Password
            </label>
            <div className="relative">
              <input
                key={`register-repeat-password-${location.href}`}
                id="repeatPassword"
                type={showRepeatPassword ? "text" : "password"}
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-md border border-slate-700 bg-slate-950/50 px-4 py-2.5 pr-11 text-slate-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                placeholder="••••••••"
                minLength={4}
                required
              />
              <button
                type="button"
                onClick={() => setShowRepeatPassword((current) => !current)}
                className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-400 transition-colors hover:text-cyan-200"
                aria-label={showRepeatPassword ? "hide password" : "show password"}
              >
                {showRepeatPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-cyan-500 px-4 py-2.5 font-medium text-slate-950 transition-colors hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Register"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void navigate({ to: "/login" })}
          className="mt-4 w-full text-sm text-slate-400 transition-colors hover:text-cyan-200"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
