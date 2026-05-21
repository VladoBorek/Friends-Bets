import { useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import { Card, PremiumCard } from "../components/ui/card";
import { CategoryPanel } from "../features/admin/components/category-panel";
import { GroupMembersPanel } from "../features/admin/components/group-members-panel";
import { GroupOverviewPanel } from "../features/admin/components/group-overview-panel";
import { GroupsPanel } from "../features/admin/components/groups-panel";
import { TerminalHeader, type TerminalTab } from "../features/admin/components/terminal-header";
import { TerminalStats } from "../features/admin/components/terminal-stats";
import { UserTable } from "../features/admin/components/user-table";
import { useCategories } from "../features/admin/hooks/use-categories";
import { useGroups } from "../features/admin/hooks/use-groups";
import { useUsers } from "../features/admin/hooks/use-users";
import { useNavigate, useSearch } from "@tanstack/react-router";

export function TerminalPage() {
  const search = useSearch({ from: "/terminal" });
  const navigate = useNavigate({ from: "/terminal" });

  const activeTab = search.tab ?? "users";
  const groupView = search.view ?? "overview";
  const selectedGroupId = search.groupId;
  const initialPage = search.page ?? 1;

  const handlePageChange = (page: number) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        page,
      }),
    });
  };

  const {
    users,
    isLoading,
    query,
    setQuery,
    feedback,
    stats,
    pagination,
    page,
    totalPages,
    actions,
  } = useUsers(initialPage);

  const {
    categories,
    feedback: categoriesFeedback,
    isLoading: isLoadingCategories,
    isSubmitting: isSubmittingCategories,
    newCategoryName,
    pagination: categoriesPagination,
    page: categoriesPage,
    totalPages: categoriesTotalPages,
    setNewCategoryName,
    actions: categoryActions,
  } = useCategories(activeTab === "categories", initialPage);

  const {
    groups,
    feedback: groupsFeedback,
    isLoading: isLoadingGroups,
    pagination: groupsPagination,
    page: groupsPage,
    totalPages: groupsTotalPages,
    query: groupsQuery,
    setQuery: setGroupsQuery,
    actions: groupActions,
  } = useGroups(activeTab === "groups", initialPage);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return groups.find((g) => g.id === selectedGroupId) ?? null;
  }, [selectedGroupId, groups]);

  const handleTabChange = (tab: TerminalTab) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        tab,
        page: 1,
        groupId: undefined,
        view: undefined,
      }),
    });
  };

  const handleSelectGroup = (groupId: number | undefined) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        groupId,
        page: 1,
        view: groupId ? "overview" : undefined,
      }),
    });
  };

  const handleViewChange = (view: "overview" | "members") => {
    void navigate({
      search: (prev) => ({
        ...prev,
        view,
      }),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto grid w-full max-w-[90rem] gap-6 px-6 pb-6 pt-1 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:pb-8 lg:pt-2">
        <main>
          <TerminalHeader
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
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

            {activeTab === "users" && (
              <UserTable
                users={users}
                isLoading={isLoading}
                query={query}
                pagination={pagination}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onQueryChange={setQuery}
                actions={actions}
              />
            )}

            {activeTab === "groups" && selectedGroup && groupView === "overview" && (
              <GroupOverviewPanel
                group={selectedGroup}
                onBackToList={() => handleSelectGroup(undefined)}
                onViewMembers={() => handleViewChange("members")}
              />
            )}

            {activeTab === "groups" && selectedGroupId && groupView === "members" && (
              <GroupMembersPanel
                groupId={selectedGroupId}
                groupName={selectedGroup?.name ?? "Group"}
                onBack={() => handleViewChange("overview")}
              />
            )}

            {activeTab === "groups" && !selectedGroupId && (
              <>
                {groupsFeedback && (
                  <div
                    className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
                      groupsFeedback.type === "success"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-200"
                    }`}
                  >
                    {groupsFeedback.message}
                  </div>
                )}
                <GroupsPanel
                  groups={groups}
                  isLoading={isLoadingGroups}
                  query={groupsQuery}
                  pagination={groupsPagination}
                  currentPage={groupsPage}
                  totalPages={groupsTotalPages}
                  onPageChange={handlePageChange}
                  onQueryChange={setGroupsQuery}
                  onSelectGroup={(group) => handleSelectGroup(group.id)}
                  actions={groupActions}
                />
              </>
            )}

            {activeTab === "categories" && (
              <CategoryPanel
                categories={categories}
                isLoading={isLoadingCategories}
                isSubmitting={isSubmittingCategories}
                newCategoryName={newCategoryName}
                pagination={categoriesPagination}
                currentPage={categoriesPage}
                totalPages={categoriesTotalPages}
                onPageChange={handlePageChange}
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
                <p className="text-slate-200">
                  {activeTab === "users"
                    ? "Users module active"
                    : activeTab === "groups"
                      ? "Groups module active"
                      : "Categories module active"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {activeTab === "users"
                    ? "Live management view enabled."
                    : activeTab === "groups"
                      ? "Group management view enabled."
                      : "Category management view enabled."}
                </p>
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
