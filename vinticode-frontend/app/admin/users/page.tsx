"use client";

import { useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";
import Link from "next/link";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

import TableSkeleton from "@/components/admin/TableSkeleton";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/states";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  _count: { solvedQuestions: number };
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchUsers = async (p = page, q = search) => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminApi.get("/users", {
        params: { page: p, limit: 20, search: q },
      });
      setUsers(res.data.users ?? []);
      setPagination(res.data.pagination);
    } catch {
      // try/finally with no catch: a failed request silently rendered the
      // "No users found" empty state, which reads as "you have no users".
      setError(true);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, search);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Per-call inline styling pinned every toast to a dark palette, so
    // toasts stayed dark on a light page. Theming now lives once in layout.
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and monitor platform users
          </p>
        </div>
      </div>

      {/*
        Two of the three cards here were fabricated:
          • "Active Today"  = Math.floor(total * 0.15) — a made-up ratio
                              presented as "Estimated active sessions".
          • "Avg. Solved"   = the hardcoded string "12.4".
        Neither value exists in the API (/admin/dashboard returns only
        totals), so both were invented numbers rendered as authoritative
        platform metrics — the kind of thing an admin makes decisions on.
        A fake metric is worse than a missing one, so they're gone.

        "Total Users" is real (server-side pagination total). The average
        below is computed from the rows actually loaded and is labelled as
        page-scoped rather than passed off as a platform-wide figure.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Total Users
          </p>
          <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
            {loading ? "—" : (pagination?.total ?? 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Registered accounts</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Avg. Solved
          </p>
          <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
            {loading || users.length === 0
              ? "—"
              : (
                  users.reduce((sum, u) => sum + (u._count?.solvedQuestions ?? 0), 0) /
                  users.length
                ).toFixed(1)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Questions per user · this page only
          </p>
        </div>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="flex gap-3 bg-card border border-border rounded-xl p-3 shadow-sm"
      >
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium rounded-lg transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-1">
              <TableSkeleton rows={8} cols={6} />
            </div>
          ) : error ? (
            <ErrorState
              title="Couldn't load users"
              description="The user list failed to load. This is usually a temporary network issue."
              onRetry={() => fetchUsers(page, search)}
              className="rounded-none border-0"
            />
          ) : users.length === 0 ? (
            /* Told the admin to "adjust your search criteria" even when no
               search was active — advice that made no sense on an empty
               platform. The two cases are now distinguished. */
            <EmptyState
              icon={Users}
              title={search ? "No matching users" : "No users yet"}
              description={
                search
                  ? `No users match “${search}”.`
                  : "Users will appear here once people sign up."
              }
              action={
                search ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                      fetchUsers(1, "");
                    }}
                  >
                    Clear search
                  </Button>
                ) : undefined
              }
              className="rounded-none border-0 bg-transparent"
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left bg-muted">
                  <th className="px-5 py-4 text-muted-foreground font-medium">#</th>
                  <th className="px-5 py-4 text-muted-foreground font-medium">Name</th>
                  <th className="px-5 py-4 text-muted-foreground font-medium">Email</th>
                  <th className="px-5 py-4 text-muted-foreground font-medium">Solved</th>
                  <th className="px-5 py-4 text-muted-foreground font-medium">Joined</th>
                  <th className="px-5 py-4 text-muted-foreground font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    className="group transition-colors hover:bg-accent"
                  >
                    <td className="px-5 py-4 text-muted-foreground">
                      {(pagination ? (pagination.page - 1) * 20 : 0) + i + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-muted border border-border-strong flex items-center justify-center shrink-0">
                          <span className="text-foreground text-sm font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-foreground font-medium group-hover:text-foreground transition-colors">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button 
                        onClick={() => copyToClipboard(u.email)}
                        className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                        title="Click to copy"
                      >
                        {u.email}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-success-subtle text-success-fg border border-success/20">
                        {u._count.solvedQuestions} solved
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground hover:text-foreground hover:bg-accent transition-all border border-transparent hover:border-border"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-muted-foreground text-xs">
              {pagination.total} total users
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-muted-foreground text-sm">
                {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
