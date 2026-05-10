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

import TableSkeleton from "@/components/admin/TableSkeleton";
import { toast } from "react-hot-toast";

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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
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
    const toastId = toast.loading("Deleting question...");
    try {
      await adminApi.delete(`/questions/${id}`);
      toast.success("Question deleted successfully", { id: toastId });
      fetchQuestions(page, search);
    } catch {
      toast.error("Failed to delete question", { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Questions</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your problem set and test cases
          </p>
        </div>
        <Link
          href="/admin/questions/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-200 text-black text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-white/5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Question
        </Link>
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
            placeholder="Search questions by title or difficulty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-1.5 bg-white hover:bg-gray-200 text-black text-sm font-medium rounded-lg transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table Section */}
      <div className="bg-[#161b22] border border-white/8 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-1">
              <TableSkeleton rows={10} cols={6} />
            </div>
          ) : questions.length === 0 ? (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <BookOpen className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-lg font-medium text-gray-400">No questions found</p>
                <p className="text-sm">Try creating a new one or adjusting search</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left bg-white/[0.02]">
                  <th className="px-5 py-4 text-gray-400 font-medium">#</th>
                  <th className="px-5 py-4 text-gray-400 font-medium">Title</th>
                  <th className="px-5 py-4 text-gray-400 font-medium">Difficulty</th>
                  <th className="px-5 py-4 text-gray-400 font-medium text-center">Solves</th>
                  <th className="px-5 py-4 text-gray-400 font-medium">Created</th>
                  <th className="px-5 py-4 text-gray-400 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {questions.map((q, i) => (
                  <tr
                    key={q.id}
                    className="group transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4 text-gray-500 font-mono text-xs">
                      {(pagination ? (pagination.page - 1) * 20 : 0) + i + 1}
                    </td>
                    <td className="px-5 py-4 text-white font-medium max-w-xs truncate group-hover:text-gray-300 transition-colors">
                      {q.title}
                    </td>
                    <td className="px-5 py-4">{difficultyBadge(q.difficulty)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-400">
                        {q._count.solvedQuestions}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {new Date(q.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() =>
                            router.push(`/admin/questions/${q.id}/edit`)
                          }
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id, q.title)}
                          disabled={deletingId === q.id}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30"
                          title="Delete"
                        >
                          {deletingId === q.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/8 bg-white/[0.01]">
            <p className="text-gray-500 text-xs font-medium">
              Showing <span className="text-white">{questions.length}</span> of <span className="text-white">{pagination.total}</span> questions
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-400 text-xs font-medium px-2">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
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

