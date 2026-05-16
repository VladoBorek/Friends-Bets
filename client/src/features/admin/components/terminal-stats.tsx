import { PremiumCard, PremiumCardLabel, PremiumCardValue } from "../../../components/ui/card";

interface TerminalStatsProps {
  total: number;
  admins: number;
  standard: number;
}

export function TerminalStats({ total, admins, standard }: TerminalStatsProps) {
  return (
    <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <PremiumCard>
        <PremiumCardLabel>Total Users</PremiumCardLabel>
        <PremiumCardValue>{total}</PremiumCardValue>
      </PremiumCard>
      <PremiumCard className="border-indigo-500/25 from-slate-900/90 via-indigo-950/20 to-slate-900/80">
        <PremiumCardLabel className="text-indigo-200/85">Admin Users</PremiumCardLabel>
        <PremiumCardValue className="text-indigo-100">{admins}</PremiumCardValue>
      </PremiumCard>
      <PremiumCard className="border-cyan-400/25 from-slate-900/90 via-cyan-950/35 to-slate-900/80">
        <PremiumCardLabel>Standard Users</PremiumCardLabel>
        <PremiumCardValue className="text-cyan-100">{standard}</PremiumCardValue>
      </PremiumCard>
    </section>
  );
}
