import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Card, PremiumCard } from "../components/ui/card";
import { CategoryPanel } from "../features/admin/components/category-panel";
import { TerminalHeader, type TerminalTab } from "../features/admin/components/terminal-header";
import { TerminalStats } from "../features/admin/components/terminal-stats";
import { UserTable } from "../features/admin/components/user-table";
import { useCategories } from "../features/admin/hooks/use-categories";
import { useUsers } from "../features/admin/hooks/use-users";

export function TerminalPage() {
  const [activeTab, setActiveTab] = useState<TerminalTab>("users");
  const { 
    users, 
    isLoading, 
    query, 
    setQuery, 
    feedback, 
    stats, 
    actions 
  } = useUsers();
  const {
    categories,
    feedback: categoriesFeedback,
    isLoading: isLoadingCategories,
    isSubmitting: isSubmittingCategories,
    newCategoryName,
    setNewCategoryName,
    actions: categoryActions,
  } = useCategories(activeTab === "categories");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid w-full max-w-[90rem] gap-6 px-6 pb-6 pt-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:pb-8 lg:pt-2">
        <main>
          <TerminalHeader activeTab={activeTab} onTabChange={setActiveTab} />
          {activeTab === "users" && <TerminalStats {...stats} />}

          <PremiumCard className="mb-6 p-4">
            {activeTab === "users" && feedback && (
              <div
                className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
                  feedback.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                }`}
              >
                {feedback.message}
              </div>
            )}

            {activeTab === "categories" && categoriesFeedback && (
              <div
                className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
                  categoriesFeedback.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                }`}
              >
                {categoriesFeedback.message}
              </div>
            )}

            {activeTab === "users" ? (
              <UserTable 
                users={users} 
                isLoading={isLoading} 
                query={query} 
                onQueryChange={setQuery} 
                actions={actions}
              />
            ) : (
              <CategoryPanel
                categories={categories}
                isLoading={isLoadingCategories}
                isSubmitting={isSubmittingCategories}
                newCategoryName={newCategoryName}
                onCategoryNameChange={setNewCategoryName}
                onAddCategory={categoryActions.addCategory}
                onDeleteCategory={categoryActions.removeCategory}
              />
            )}
          </PremiumCard>
        </main>

        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <Card className="p-4">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-100">
              <ShieldAlert className="h-4 w-4 text-cyan-300" /> Audit Log
            </h2>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-slate-200">{activeTab === "users" ? "Users module active" : "Categories module active"}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {activeTab === "users" ? "Live management view enabled." : "Category management view enabled."}
                </p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-slate-500">Groups module</p>
                <p className="mt-1 text-xs text-slate-600">Under Construction</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-slate-500">Category deletion policy</p>
                <p className="mt-1 text-xs text-slate-600">Category can be removed only when it has no wagers and no bets.</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
