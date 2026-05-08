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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-gray-400 text-sm mt-1">
          All registered platform users
        </p>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="flex gap-3 bg-[#161b22] border border-white/8 rounded-xl p-3"
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
          className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-[#161b22] border border-white/8 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left">
                <th className="px-5 py-3 text-gray-400 font-medium">#</th>
                <th className="px-5 py-3 text-gray-400 font-medium">Name</th>
                <th className="px-5 py-3 text-gray-400 font-medium">Email</th>
                <th className="px-5 py-3 text-gray-400 font-medium">Solved</th>
                <th className="px-5 py-3 text-gray-400 font-medium">Joined</th>
                <th className="px-5 py-3 text-gray-400 font-medium text-right">
                  View
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Users className="w-8 h-8" />
                      <p>No users found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-500">
                      {(pagination ? (pagination.page - 1) * 20 : 0) + i + 1}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-400">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {u._count.solvedQuestions} solved
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="inline-flex items-center gap-1 p-1.5 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                        title="View user detail"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
