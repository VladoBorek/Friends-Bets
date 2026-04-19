import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardDescription, CardTitle } from "../components/ui/card";
import type { WalletOverview } from "../../../shared/src/schemas/wallet";

function formatMoney(value: string): string {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : value;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function WalletPage() {
  const [wallet, setWallet] = useState<WalletOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadWallet() {
      try {
        const response = await fetch("/api/wallet/me", { signal: controller.signal });
        const json = (await response.json().catch(() => null)) as { data?: WalletOverview; message?: string } | null;

        if (!response.ok) {
          throw new Error(json?.message ?? "Unable to load wallet");
        }

        setWallet(json?.data ?? null);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load wallet");
      } finally {
        setIsLoading(false);
      }
    }

    void loadWallet();
    return () => controller.abort();
  }, []);

  if (isLoading) {
    return <p className="text-slate-300">Loading wallet...</p>;
  }

  if (error) {
    return <p className="text-rose-300">{error}</p>;
  }

  if (!wallet) {
    return <p className="text-slate-300">Wallet not found.</p>;
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardTitle>Wallet</CardTitle>
        <CardDescription className="mt-2">
          Current balance and wager history affecting the active account.
        </CardDescription>
        <div className="mt-4 text-3xl font-semibold text-cyan-200">{formatMoney(wallet.balance)}</div>
      </Card>

      <Card>
        <CardTitle>History</CardTitle>
        <div className="mt-4 grid gap-3">
          {wallet.history.length === 0 && <p className="text-sm text-slate-400">No wager history yet.</p>}
          {wallet.history.map((item) => (
            <Link
              key={item.id}
              to="/wagers/$wagerId"
              params={{ wagerId: String(item.wagerId) }}
              className="block rounded-md border border-slate-800 bg-slate-950/50 p-4 transition-colors hover:border-cyan-500/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-100">{item.wagerName}</p>
                  <p className="text-xs text-slate-400">{formatTimestamp(item.timestamp)}</p>
                </div>
                <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">
                  {item.outcome}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-wide text-slate-400">{item.type}</p>
                <p className={Number(item.walletImpact) >= 0 ? "text-emerald-300" : "text-rose-300"}>
                  Wallet impact: {item.walletImpact}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
