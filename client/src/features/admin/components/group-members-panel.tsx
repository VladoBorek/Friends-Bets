import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { FriendsPagination } from "../../friends/components/friends-pagination";
import { GroupMemberActionMenu } from "./group-member-action-menu";
import { useGroupMembers } from "../hooks/use-group-members";

interface GroupMembersPanelProps {
  groupId: number;
  groupName: string;
  onBack: () => void;
}

export function GroupMembersPanel({ groupId, groupName, onBack }: GroupMembersPanelProps) {
  const {
    members,
    feedback,
    isLoading,
    pagination,
    page,
    totalPages,
    query,
    setFeedback,
    setQuery,
    setPage,
    actions,
  } = useGroupMembers(groupId);

  const firstVisible = pagination && pagination.total > 0
    ? Math.min(pagination.offset + 1, pagination.total)
    : 0;
  const lastVisible = pagination
    ? Math.min(pagination.offset + members.length, pagination.total)
    : members.length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Members of {groupName}</h2>
          {pagination && pagination.total > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Showing {firstVisible}-{lastVisible} of {pagination.total}
            </p>
          )}
        </div>
        <div className="flex-1 sm:ml-auto sm:max-w-xs">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="search members..."
          />
        </div>
      </div>

      {feedback && (
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

      <div className="overflow-x-auto overflow-y-visible rounded-xl border border-slate-800 bg-slate-900/50">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading members...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No matching members found.</div>
        ) : (
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col />
              <col className="w-[120px]" />
              <col className="w-[140px]" />
              <col className="w-[72px]" />
            </colgroup>
            <thead className="border-b border-slate-800/50 bg-slate-900/80">
              <tr>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Member</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Role</th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">Joined</th>
                <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-slate-800/50">
              {members.map((member, index) => (
                <tr key={member.id} className="hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-200">{member.username}</span>
                      <span className="text-xs text-slate-500">{member.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                        member.groupRole === "OWNER"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                          : "border-slate-500/20 bg-slate-500/10 text-slate-300"
                      }`}
                    >
                      {member.groupRole === "OWNER" ? "Owner" : "Member"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-2 py-4 text-right">
                    <GroupMemberActionMenu
                      member={member}
                      members={members}
                      index={index}
                      onRemove={actions.removeMember}
                      onChangeOwner={actions.changeOwner}
                      setFeedback={setFeedback}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && pagination && pagination.total > 0 && (
        <div className="mt-5">
          <FriendsPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
