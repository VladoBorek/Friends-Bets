import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid credentials");
      }

      await refreshUser();
      await navigate({ to: "/" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/20 bg-slate-900 p-8 shadow-xl shadow-cyan-950/20 text-slate-100">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 inline-flex rounded-full bg-cyan-950/50 p-3 ring-1 ring-cyan-500/30">
            <LogIn className="h-6 w-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">System Access</h1>
          <p className="mt-2 text-sm text-slate-400">Enter your credentials to continue</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-rose-500/10 p-4 text-sm text-rose-400 ring-1 ring-rose-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-slate-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
              placeholder="operator@pb138.net"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950/50 px-4 py-2.5 text-slate-200 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-cyan-500 px-4 py-2.5 font-medium text-slate-950 transition-colors hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50"
          >
            {isLoading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
