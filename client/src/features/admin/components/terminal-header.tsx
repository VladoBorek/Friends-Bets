import { LayoutDashboard, UserRound, Users, Tags } from "lucide-react";
import { Button } from "../../../components/ui/button";

export type TerminalTab = "users" | "categories";

interface TerminalHeaderProps {
  activeTab: TerminalTab;
  onTabChange: (tab: TerminalTab) => void;
}

export function TerminalHeader({ activeTab, onTabChange }: TerminalHeaderProps) {
  return (
    <>
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">Admin</p>
        <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight text-slate-100">
          <LayoutDashboard className="h-6 w-6 text-cyan-400" /> Terminal
        </h1>
        <p className="mt-1 text-sm text-slate-400">Manage users, review system activity, and monitor administration flows.</p>
      </header>

      <nav className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/55 p-1">
        <Button
          variant={activeTab === "users" ? "default" : "ghost"}
          size="sm"
          className="gap-2"
          onClick={() => onTabChange("users")}
        >
          <UserRound className="h-4 w-4" />
          <span>Users</span>
        </Button>
        <Button variant="ghost" size="sm" disabled className="gap-2 text-slate-500">
          <Users className="h-4 w-4" />
          <span>Groups</span>
        </Button>
        <Button
          variant={activeTab === "categories" ? "default" : "ghost"}
          size="sm"
          className={activeTab === "categories" ? "gap-2" : "gap-2 text-slate-300"}
          onClick={() => onTabChange("categories")}
        >
          <Tags className="h-4 w-4" />
          <span>Categories</span>
        </Button>
      </nav>
    </>
  );
}
