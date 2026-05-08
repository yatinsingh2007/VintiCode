"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import adminApi from "@/lib/adminApi";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
} from "lucide-react";

interface Question {
  id: string;
  title: string;
  difficulty: string;
  createdAt: string;
  _count: { solvedQuestions: number };
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

const difficultyColors: Record<string, string> = {
  Easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Hard: "text-red-400 bg-red-500/10 border-red-500/20",
};

function difficultyBadge(diff: string) {
  const cls =
    difficultyColors[diff] ?? "text-gray-400 bg-gray-500/10 border-gray-500/20";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${cls}`}>
      {diff}
    </span>
  );
}

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchQuestions = async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await adminApi.get("/questions", {
        params: { page: p, limit: 20, search: q },
      });
      setQuestions(res.data.questions);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions(1, search);
  };

  const handleDelete = async (id: string, title: string) => {
    if (
      !window.confirm(
        `Delete "${title}"?\n\nThis will also delete all submissions for this question.`
      )
    )
      return;
    setDeletingId(id);
    try {
      await adminApi.delete(`/questions/${id}`);
      fetchQuestions(page, search);
    } catch {
      alert("Failed to delete question.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Questions</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage all coding problems
          </p>
        </div>
        <Link
          href="/admin/questions/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          New Question
        </Link>
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
            placeholder="Search by title or difficulty…"
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
                <th className="px-5 py-3 text-gray-400 font-medium">Title</th>
                <th className="px-5 py-3 text-gray-400 font-medium">
                  Difficulty
                </th>
                <th className="px-5 py-3 text-gray-400 font-medium">
                  Solves
                </th>
                <th className="px-5 py-3 text-gray-400 font-medium">
                  Created
                </th>
                <th className="px-5 py-3 text-gray-400 font-medium text-right">
                  Actions
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
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <BookOpen className="w-8 h-8" />
                      <p>No questions found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                questions.map((q, i) => (
                  <tr
                    key={q.id}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-500">
                      {(pagination ? (pagination.page - 1) * 20 : 0) + i + 1}
                    </td>
                    <td className="px-5 py-3 text-white font-medium max-w-xs truncate">
                      {q.title}
                    </td>
                    <td className="px-5 py-3">{difficultyBadge(q.difficulty)}</td>
                    <td className="px-5 py-3 text-gray-400">
                      {q._count.solvedQuestions}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(q.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            router.push(`/admin/questions/${q.id}/edit`)
                          }
                          className="p-1.5 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id, q.title)}
                          disabled={deletingId === q.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          {deletingId === q.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
            <p className="text-gray-500 text-xs">
              {pagination.total} total questions
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
