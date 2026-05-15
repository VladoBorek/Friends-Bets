import { Link } from "@tanstack/react-router";
import type { WalletHistoryItem } from "../../../../../shared/src/schemas/wallet";
import { cn } from "../../../lib/utils";

interface WalletHistoryItemProps {
  item: WalletHistoryItem;
  formattedTimestamp: string;
}

export function WalletHistoryItemCard({ item, formattedTimestamp }: WalletHistoryItemProps) {
  const isWagerTransaction = (item.type === "bet" || item.type === "payout") && item.wagerId !== null;
  const cardClassName = cn(
    "block rounded-md border border-slate-800 bg-slate-950/50 p-4",
    isWagerTransaction && "transition-colors hover:border-cyan-500/40",
  );

  const content = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-slate-100">{item.wagerName}</p>
          <p className="text-xs text-slate-400">{formattedTimestamp}</p>
        </div>
        <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">{item.outcome}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
        <p className="text-xs uppercase tracking-wide text-slate-400">{item.type}</p>
        <p className={Number(item.walletImpact) >= 0 ? "text-emerald-300" : "text-rose-300"}>
          Wallet impact: {item.walletImpact}
        </p>
      </div>
    </>
  );

  if (isWagerTransaction) {
    return (
      <Link to="/wagers/$wagerId" params={{ wagerId: String(item.wagerId) }} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
