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
import { EmptyState, ErrorState } from "@/components/ui/states";
import { PlayButton, PlayCard, A } from "@/components/playground";

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
    toast.success("Copied to clipboard");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-pg-text">Users</h1>
        <p className="mt-1 text-sm font-medium text-pg-text-muted">
          Manage and monitor platform users
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PlayCard color={A.cyan} offset={6} className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-pg-text-muted">Total Users</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-pg-text">
            {loading ? "—" : (pagination?.total ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-[10px] font-medium text-pg-text-faint">Registered accounts</p>
        </PlayCard>
        <PlayCard color={A.amber} offset={6} className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-pg-text-muted">Avg. Solved</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-pg-text">
            {loading || users.length === 0
              ? "—"
              : (
                  users.reduce((sum, u) => sum + (u._count?.solvedQuestions ?? 0), 0) /
                  users.length
                ).toFixed(1)}
          </p>
          <p className="mt-1 text-[10px] font-medium text-pg-text-faint">
            Questions per user · this page only
          </p>
        </PlayCard>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="flex gap-3 rounded-2xl border-[3px] border-pg-border bg-pg-surface p-3"
      >
        <div className="flex flex-1 items-center gap-2">
          <Search className="size-4 shrink-0 text-pg-text-faint" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-pg-text placeholder:text-pg-text-faint outline-none"
          />
        </div>
        <PlayButton type="submit" fill={A.cyan} shadow="#0d0d11" text="#0a0a0d" className="!px-5 !py-1.5 text-sm">
          Search
        </PlayButton>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border-[3px] border-pg-border bg-pg-surface">
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
                  <PlayButton
                    fill="#0d0d11"
                    shadow={A.cyan}
                    text="#ffffff"
                    className="!px-4 !py-2 text-sm"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                      fetchUsers(1, "");
                    }}
                  >
                    Clear search
                  </PlayButton>
                ) : undefined
              }
              className="rounded-none border-0 bg-transparent"
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-[3px] border-pg-border bg-pg-surface text-left">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-pg-text-muted">#</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-pg-text-muted">Name</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-pg-text-muted">Email</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-pg-text-muted">Solved</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-pg-text-muted">Joined</th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-pg-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-[3px] divide-black/40">
                {users.map((u, i) => (
                  <tr key={u.id} className="group transition-colors hover:bg-pg-text/5">
                    <td className="px-5 py-4 font-mono text-xs text-pg-text-muted">
                      {(pagination ? (pagination.page - 1) * 20 : 0) + i + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="grid size-9 shrink-0 place-items-center rounded-xl border-2 border-pg-border text-black"
                          style={{ background: A.lime }}
                        >
                          <span className="text-sm font-black">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-bold text-pg-text">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => copyToClipboard(u.email)}
                        className="flex items-center gap-1.5 text-pg-text-muted transition-colors hover:text-pg-text"
                        title="Click to copy"
                      >
                        {u.email}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center rounded-md border-2 border-pg-border px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-black"
                        style={{ background: A.lime }}
                      >
                        {u._count.solvedQuestions} solved
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-pg-text-muted">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border-2 border-pg-border bg-pg-surface px-3 py-1.5 text-pg-text transition-colors hover:bg-[var(--pg-cyan)] hover:text-black"
                      >
                        <ExternalLink className="size-3.5" strokeWidth={2.5} />
                        <span className="text-xs font-bold">Details</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t-[3px] border-pg-border bg-pg-surface px-5 py-3">
            <p className="text-xs font-medium text-pg-text-muted">{pagination.total} total users</p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border-2 border-transparent p-1.5 text-pg-text-muted transition-all hover:border-pg-border hover:bg-pg-text/5 hover:text-pg-text disabled:opacity-30"
              >
                <ChevronLeft className="size-4" strokeWidth={2.5} />
              </button>
              <span className="text-sm font-bold text-pg-text-muted">
                {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border-2 border-transparent p-1.5 text-pg-text-muted transition-all hover:border-pg-border hover:bg-pg-text/5 hover:text-pg-text disabled:opacity-30"
              >
                <ChevronRight className="size-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
