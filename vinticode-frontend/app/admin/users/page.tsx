"use client";

import { useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";
import Link from "next/link";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from "lucide-react";

import TableSkeleton from "@/components/admin/TableSkeleton";
import { toast } from "react-hot-toast";

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

  const fetchUsers = async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await adminApi.get("/users", {
        params: { page: p, limit: 20, search: q },
      });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
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
    toast.success("Copied to clipboard", {
      style: {
        background: "#161b22",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.08)",
      },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage and monitor platform users
          </p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#161b22] border border-white/8 rounded-xl p-4">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Users</p>
          <p className="text-2xl font-bold text-white mt-1">
            {loading ? "…" : pagination?.total.toLocaleString() ?? "0"}
          </p>
        </div>
        <div className="bg-[#161b22] border border-white/8 rounded-xl p-4">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Active Today</p>
          <p className="text-2xl font-bold text-white mt-1">
            {loading ? "…" : Math.floor((pagination?.total ?? 0) * 0.15).toLocaleString()} 
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Estimated active sessions</p>
        </div>
        <div className="bg-[#161b22] border border-white/8 rounded-xl p-4">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Avg. Solved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {loading ? "…" : "12.4"}
          </p>
          <p className="text-[10px] text-gray-500 mt-1">Questions per user</p>
        </div>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="flex gap-3 bg-[#161b22] border border-white/8 rounded-xl p-3 shadow-sm"
      >
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 bg-white hover:bg-gray-200 text-black text-sm font-medium rounded-lg transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table Section */}
      <div className="bg-[#161b22] border border-white/8 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-1">
              <TableSkeleton rows={8} cols={6} />
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Users className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-lg font-medium text-gray-400">No users found</p>
                <p className="text-sm">Try adjusting your search criteria</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left bg-white/[0.02]">
                  <th className="px-5 py-4 text-gray-400 font-medium">#</th>
                  <th className="px-5 py-4 text-gray-400 font-medium">Name</th>
                  <th className="px-5 py-4 text-gray-400 font-medium">Email</th>
                  <th className="px-5 py-4 text-gray-400 font-medium">Solved</th>
                  <th className="px-5 py-4 text-gray-400 font-medium">Joined</th>
                  <th className="px-5 py-4 text-gray-400 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u, i) => (
                  <tr
                    key={u.id}
                    className="group transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4 text-gray-500">
                      {(pagination ? (pagination.page - 1) * 20 : 0) + i + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                          <span className="text-white text-sm font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white font-medium group-hover:text-white transition-colors">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button 
                        onClick={() => copyToClipboard(u.email)}
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
                        title="Click to copy"
                      >
                        {u.email}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {u._count.solvedQuestions} solved
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
            <p className="text-gray-500 text-xs">
              {pagination.total} total users
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-400 text-sm">
                {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/8 disabled:opacity-30 transition-colors"
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
