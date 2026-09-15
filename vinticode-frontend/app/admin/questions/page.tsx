"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import adminApi from "@/lib/adminApi";
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
import { Badge, difficultyVariant } from "@/components/ui/badge";
import { PlayButton, A } from "@/components/playground";

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
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Questions</h1>
          <p className="mt-1 text-sm font-medium text-white/55">
            Manage your problem set and test cases
          </p>
        </div>
        <PlayButton onClick={() => router.push("/admin/questions/new")} fill={A.lime} shadow={A.coral}>
          <Plus className="size-4" strokeWidth={3} />
          New Question
        </PlayButton>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="flex gap-3 rounded-2xl border-[3px] border-black bg-[#141419] p-3"
      >
        <div className="flex flex-1 items-center gap-2">
          <Search className="size-4 shrink-0 text-white/40" />
          <input
            type="text"
            placeholder="Search questions by title or difficulty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-white placeholder:text-white/30 outline-none"
          />
        </div>
        <PlayButton type="submit" fill={A.cyan} shadow="#0d0d11" text="#0a0a0d" className="!px-6 !py-1.5 text-sm">
          Search
        </PlayButton>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border-[3px] border-black bg-[#141419]">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-1">
              <TableSkeleton rows={10} cols={6} />
            </div>
          ) : questions.length === 0 ? (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-2 text-white/50">
                <BookOpen className="mb-2 size-10 opacity-30" />
                <p className="text-lg font-extrabold text-white">No questions found</p>
                <p className="text-sm font-medium">Try creating a new one or adjusting search</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-[3px] border-black bg-[#0d0d11] text-left">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-white/50">#</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-white/50">Title</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-white/50">Difficulty</th>
                  <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-white/50">Solves</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-white/50">Created</th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-white/50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-[3px] divide-black/40">
                {questions.map((q, i) => (
                  <tr key={q.id} className="group transition-colors hover:bg-white/5">
                    <td className="px-5 py-4 font-mono text-xs text-white/50">
                      {(pagination ? (pagination.page - 1) * 20 : 0) + i + 1}
                    </td>
                    <td className="max-w-xs truncate px-5 py-4 font-bold text-white">{q.title}</td>
                    <td className="px-5 py-4">
                      <Badge variant={difficultyVariant(q.difficulty)}>{q.difficulty}</Badge>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="rounded-md border-2 border-black bg-[#0d0d11] px-2 py-0.5 font-mono text-xs font-bold text-white/70">
                        {q._count.solvedQuestions}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-white/50">
                      {new Date(q.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => router.push(`/admin/questions/${q.id}/edit`)}
                          className="rounded-lg border-2 border-transparent p-2 text-white/60 transition-all hover:border-black hover:bg-[var(--pg-cyan)] hover:text-black"
                          title="Edit"
                        >
                          <Pencil className="size-3.5" strokeWidth={2.5} />
                        </button>
                        <button
                          onClick={() => handleDelete(q.id, q.title)}
                          disabled={deletingId === q.id}
                          className="rounded-lg border-2 border-transparent p-2 text-white/60 transition-all hover:border-black hover:bg-[var(--pg-coral)] hover:text-black disabled:opacity-30"
                          title="Delete"
                        >
                          {deletingId === q.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" strokeWidth={2.5} />
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
          <div className="flex items-center justify-between border-t-[3px] border-black bg-[#0d0d11] px-5 py-4">
            <p className="text-xs font-medium text-white/50">
              Showing <span className="font-bold text-white">{questions.length}</span> of{" "}
              <span className="font-bold text-white">{pagination.total}</span> questions
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border-2 border-transparent p-2 text-white/60 transition-all hover:border-black hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="size-4" strokeWidth={2.5} />
              </button>
              <span className="px-2 text-xs font-bold text-white/60">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border-2 border-transparent p-2 text-white/60 transition-all hover:border-black hover:bg-white/5 hover:text-white disabled:opacity-30"
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
