import { useEffect, useRef, useState } from "react";
import { Input } from "../../../components/ui/input";

export type UserSearchResult = { id: number; username: string; email: string };

interface UserSearchSectionProps {
  invitedUsers: UserSearchResult[];
  onAdd: (user: UserSearchResult) => void;
  onRemove: (id: number) => void;
}

export function UserSearchSection({ invitedUsers, onAdd, onRemove }: UserSearchSectionProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length === 0) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/users/search?email=${encodeURIComponent(value.trim())}`);
        if (!response.ok) return;
        const json = (await response.json()) as { data: UserSearchResult[] };
        const filtered = (json.data ?? []).filter((u) => !invitedUsers.some((inv) => inv.id === u.id));
        setResults(filtered);
        setDropdownOpen(filtered.length > 0);
      } catch {
        /* ignore */
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  function handleAdd(user: UserSearchResult) {
    onAdd(user);
    setQuery("");
    setResults([]);
    setDropdownOpen(false);
  }

  return (
    <div className="grid gap-3 rounded border border-slate-700 p-4">
      <p className="text-sm font-medium text-slate-300">Invite users</p>
      {invitedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {invitedUsers.map((user) => (
            <span
              key={user.id}
              className="flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-200"
            >
              <span>{user.username}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-400">{user.email}</span>
              <button
                type="button"
                onClick={() => onRemove(user.id)}
                className="ml-1 text-slate-400 hover:text-rose-400"
                aria-label={`Remove ${user.username}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <div ref={containerRef} className="relative">
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search by email address…"
          autoComplete="off"
        />
        {isSearching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">Searching…</span>
        )}
        {dropdownOpen && results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded border border-slate-700 bg-slate-900 shadow-lg">
            {results.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => handleAdd(user)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-800"
                >
                  <span className="font-medium text-slate-200">{user.username}</span>
                  <span className="text-slate-400">{user.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
