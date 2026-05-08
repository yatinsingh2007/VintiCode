"use client";

import { useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";
import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileCode2,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Filter,
} from "lucide-react";

// Judge0 language names
const LANG_MAP: Record<number, string> = {
  50: "C",
  54: "C++",
  62: "Java",
  63: "JavaScript",
  71: "Python",
  72: "Ruby",
  73: "Rust",
  74: "TypeScript",
};

function getLang(id: number) {
  return LANG_MAP[id] ?? `Lang#${id}`;
}

interface Submission {
  id: string;
  status: string;
  languageId: number;
  code: string;
  createdAt: string;
  user: { name: string; email: string };
  question: { title: string; difficulty: string };
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

function statusBadge(status: string) {
  const base =
    "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium";
  if (status === "accepted")
    return (
      <span className={`${base} bg-emerald-500/15 text-emerald-400`}>
        <CheckCircle2 className="w-3 h-3" />
        Accepted
      </span>
    );
  return (
    <span className={`${base} bg-red-500/15 text-red-400`}>
      <XCircle className="w-3 h-3" />
      Rejected
    </span>
  );
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Submission detail modal
  const [selected, setSelected] = useState<Submission | null>(null);

  const fetchSubmissions = async (
    p = page,
    q = search,
    s = filterStatus
  ) => {
    setLoading(true);
    try {
      const res = await adminApi.get("/submissions", {
        params: { page: p, limit: 20, search: q, status: s || undefined },
      });
      setSubmissions(res.data.submissions);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(page, search, filterStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubmissions(1, search, filterStatus);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Submissions</h1>
        <p className="text-gray-400 text-sm mt-1">
          All code submissions across the platform
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-3 bg-[#161b22] border border-white/8 rounded-xl p-3"
      >
        <div className="flex-1 min-w-48 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by user or question…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#0d1117] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-violet-500"
          >
            <option value="">All Statuses</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors"
        >
          Apply
        </button>
      </form>

      {/* Table */}
      <div className="bg-[#161b22] border border-white/8 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left">
                <th className="px-5 py-3 text-gray-400 font-medium">User</th>
                <th className="px-5 py-3 text-gray-400 font-medium">
                  Question
                </th>
                <th className="px-5 py-3 text-gray-400 font-medium">Status</th>
                <th className="px-5 py-3 text-gray-400 font-medium">
                  Language
                </th>
                <th className="px-5 py-3 text-gray-400 font-medium">Date</th>
                <th className="px-5 py-3 text-gray-400 font-medium text-right">
                  Code
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
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <FileCode2 className="w-8 h-8" />
                      <p>No submissions found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="text-white font-medium">
                        {s.user?.name ?? "—"}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {s.user?.email ?? ""}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-white max-w-xs truncate">
                        {s.question?.title ?? "—"}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {s.question?.difficulty ?? ""}
                      </p>
                    </td>
                    <td className="px-5 py-3">{statusBadge(s.status)}</td>
                    <td className="px-5 py-3">
                      <span className="text-gray-400 text-xs font-mono">
                        {getLang(s.languageId)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelected(s)}
                        className="inline-flex items-center gap-1 p-1.5 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                        title="View code"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
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
              {pagination.total} total submissions
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

      {/* Code viewer modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#161b22] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div>
                <p className="text-white font-semibold">
                  {selected.question?.title}
                </p>
                <p className="text-gray-500 text-xs">
                  {selected.user?.name} · {getLang(selected.languageId)} ·{" "}
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(selected.status)}
                <button
                  onClick={() => setSelected(null)}
                  className="text-gray-500 hover:text-white text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-5 text-sm text-green-300 font-mono bg-[#0d1117] whitespace-pre-wrap break-all">
              {selected.code || "No code stored."}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
