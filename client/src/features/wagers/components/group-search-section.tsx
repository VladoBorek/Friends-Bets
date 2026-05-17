import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { GroupSummary } from "@pb138/shared/schemas/groups";
import { Input } from "../../../components/ui/input";
import type { UserSearchResult } from "./user-search-section";

export type GroupInvitation = {
  groupId: number;
  groupName: string;
  members: UserSearchResult[];
  excludedIds: Set<number>;
};

interface GroupSearchSectionProps {
  addedGroups: GroupInvitation[];
  currentUserId?: number;
  onAddGroup: (group: GroupInvitation) => void;
  onUpdateGroup: (groupId: number, excludedIds: Set<number>) => void;
  onRemoveGroup: (groupId: number) => void;
}

type MemberRow = { id: number; username: string; email: string };
type PaginatedApiResponse<T> = { data: T[]; pagination: { hasMore: boolean }; message?: string };

async function fetchAllGroupMembers(groupId: number, currentUserId?: number): Promise<UserSearchResult[]> {
  const all: MemberRow[] = [];
  let offset = 0;

  while (true) {
    const res = await fetch(`/api/groups/${groupId}/members?limit=50&offset=${offset}`);
    const json = (await res.json()) as PaginatedApiResponse<MemberRow>;
    if (!res.ok) throw new Error(json.message ?? "Failed to load members");
    all.push(...(json.data ?? []));
    if (!json.pagination.hasMore) break;
    offset += 50;
  }

  return all
    .filter((m) => m.id !== currentUserId)
    .map((m) => ({ id: m.id, username: m.username, email: m.email }));
}

export function GroupSearchSection({
  addedGroups,
  currentUserId,
  onAddGroup,
  onUpdateGroup,
  onRemoveGroup,
}: GroupSearchSectionProps) {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadGroups() {
      try {
        const all: GroupSummary[] = [];
        let offset = 0;
        while (true) {
          const res = await fetch(`/api/groups?limit=50&offset=${offset}`);
          const json = (await res.json()) as PaginatedApiResponse<GroupSummary>;
          if (!res.ok) throw new Error(json.message ?? "Failed to load groups");
          all.push(...(json.data ?? []));
          if (!json.pagination.hasMore) break;
          offset += 50;
        }
        setGroups(all);
      } catch (e) {
        setGroupsError(e instanceof Error ? e.message : "Failed to load groups");
      } finally {
        setIsLoadingGroups(false);
      }
    }
    void loadGroups();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addedGroupIds = new Set(addedGroups.map((g) => g.groupId));

  const filteredGroups = groups
    .filter((g) => !addedGroupIds.has(g.id))
    .filter((g) => g.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));

  const availableGroupCount = groups.filter((g) => !addedGroupIds.has(g.id)).length;

  function toggleExpanded(groupId: number) {
    setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
  }

  async function handleSelectGroup(group: GroupSummary) {
    setDropdownOpen(false);
    setSearchQuery("");
    setMembersError(null);
    setIsLoadingMembers(true);
    try {
      const members = await fetchAllGroupMembers(group.id, currentUserId);
      onAddGroup({
        groupId: group.id,
        groupName: group.name,
        members,
        excludedIds: new Set(),
      });
      setExpandedGroupId(group.id);
    } catch (e) {
      setMembersError(e instanceof Error ? e.message : "Failed to load members");
    } finally {
      setIsLoadingMembers(false);
    }
  }

  function toggleAddedExclusion(groupId: number, memberId: number, currentExcludedIds: Set<number>) {
    const next = new Set(currentExcludedIds);
    if (next.has(memberId)) next.delete(memberId);
    else next.add(memberId);
    onUpdateGroup(groupId, next);
  }

  return (
    <div className="grid gap-3 rounded border border-slate-700 p-4">
      <p className="text-sm font-medium text-slate-300">Invite groups</p>

      {/* Accordion cards for each added group */}
      {addedGroups.map((gi) => {
        const includedCount = gi.members.length - gi.excludedIds.size;
        const isExpanded = expandedGroupId === gi.groupId;

        return (
          <div
            key={gi.groupId}
            className="overflow-hidden rounded border border-slate-700/60 bg-slate-800/40"
          >
            <button
              type="button"
              onClick={() => toggleExpanded(gi.groupId)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-700/30"
            >
              <span className="flex-1 text-sm font-medium text-slate-200">{gi.groupName}</span>
              <span className="text-xs text-slate-400">
                {includedCount} / {gi.members.length} member{gi.members.length !== 1 ? "s" : ""}
              </span>
              {isExpanded
                ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
              <span
                role="button"
                tabIndex={0}
                aria-label={`Remove group ${gi.groupName}`}
                onClick={(e) => { e.stopPropagation(); onRemoveGroup(gi.groupId); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onRemoveGroup(gi.groupId); } }}
                className="ml-1 rounded p-0.5 text-slate-400 hover:text-rose-400"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-700/60 px-3 pb-3 pt-2">
                {gi.members.length === 0 ? (
                  <p className="text-xs text-slate-500">No members to invite.</p>
                ) : (
                  <div className="grid max-h-40 gap-0.5 overflow-y-auto">
                    {gi.members.map((member) => {
                      const excluded = gi.excludedIds.has(member.id);
                      return (
                        <label
                          key={member.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-slate-700/40"
                        >
                          <input
                            type="checkbox"
                            checked={!excluded}
                            onChange={() => toggleAddedExclusion(gi.groupId, member.id, gi.excludedIds)}
                            className="accent-cyan-400"
                          />
                          <span className={`text-sm ${excluded ? "text-slate-500 line-through" : "text-slate-200"}`}>
                            {member.username}
                          </span>
                          <span className={`text-xs ${excluded ? "text-slate-600" : "text-slate-400"}`}>
                            {member.email}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Group search dropdown */}
      <div ref={dropdownRef} className="relative">
        {isLoadingGroups ? (
          <p className="text-xs text-slate-400">Loading your groups…</p>
        ) : groupsError ? (
          <p className="text-xs text-rose-300">{groupsError}</p>
        ) : availableGroupCount === 0 ? (
          <p className="text-xs text-slate-400">
            {addedGroups.length > 0 ? "All your groups have been added." : "You have no groups to invite."}
          </p>
        ) : (
          <>
            <Input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Search your groups…"
              autoComplete="off"
              disabled={isLoadingMembers}
            />
            {dropdownOpen && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded border border-slate-700 bg-slate-900 shadow-lg">
                {filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                    <li key={group.id}>
                      <button
                        type="button"
                        onClick={() => void handleSelectGroup(group)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-800"
                      >
                        <span className="flex-1 font-medium text-slate-200">{group.name}</span>
                        <span className="text-slate-400">
                          {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                        </span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-sm text-slate-500">No matching groups.</li>
                )}
              </ul>
            )}
          </>
        )}
        {isLoadingMembers && <p className="mt-1 text-xs text-slate-400">Adding group…</p>}
        {membersError && <p className="mt-1 text-xs text-rose-300">{membersError}</p>}
      </div>
    </div>
  );
}
