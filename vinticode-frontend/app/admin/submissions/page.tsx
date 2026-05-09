"use client";

import { useState, useEffect } from "react";
import adminApi from "@/lib/adminApi";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { toast } from "react-hot-toast";
import { 
  Copy, 
  Check, 
  X, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  FileCode2, 
  ChevronLeft, 
  ChevronRight 
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
    "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border";
  if (status === "accepted")
    return (
      <span className={`${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>
        <CheckCircle2 className="w-3 h-3" />
        Accepted
      </span>
    );
  return (
    <span className={`${base} bg-red-500/10 text-red-400 border-red-500/20`}>
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
  const [copied, setCopied] = useState(false);

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

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard", {
      style: {
        background: "#161b22",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.08)",
      },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Submissions</h1>
        <p className="text-gray-400 text-sm mt-1">
          Monitor code quality and platform activity
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-3 bg-[#161b22] border border-white/8 rounded-xl p-3 shadow-sm"
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
            className="bg-[#0d1117] border border-white/10 text-gray-300 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-violet-500 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-6 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Apply
        </button>
      </form>

      {/* Table Section */}
      <div className="bg-[#161b22] border border-white/8 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-1">
              <TableSkeleton rows={10} cols={6} />
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <FileCode2 className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-lg font-medium text-gray-400">No submissions found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left bg-white/[0.02]">
                  <th className="px-5 py-4 text-gray-400 font-medium">User</th>
                  <th className="px-5 py-4 text-gray-400 font-medium">Question</th>
                  <th className="px-5 py-4 text-gray-400 font-medium">Status</th>
                  <th className="px-5 py-4 text-gray-400 font-medium text-center">Language</th>
                  <th className="px-5 py-4 text-gray-400 font-medium">Date</th>
                  <th className="px-5 py-4 text-gray-400 font-medium text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {submissions.map((s) => (
                  <tr
                    key={s.id}
                    className="group transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <p className="text-white font-medium group-hover:text-violet-400 transition-colors">
                        {s.user?.name ?? "—"}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {s.user?.email ?? ""}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-white max-w-xs truncate font-medium">
                        {s.question?.title ?? "—"}
                      </p>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        {s.question?.difficulty ?? ""}
                      </span>
                    </td>
                    <td className="px-5 py-4">{statusBadge(s.status)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-400 text-[10px] font-mono">
                        {getLang(s.languageId)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {new Date(s.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelected(s)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                      >
                        <FileCode2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Code</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/8 bg-white/[0.01]">
            <p className="text-gray-500 text-xs font-medium">
              Showing <span className="text-white">{submissions.length}</span> of <span className="text-white">{pagination.total}</span> submissions
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

      {/* Code viewer modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-in fade-in duration-300"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#0d1117] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <FileCode2 className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">
                    {selected.question?.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500 text-xs font-medium">
                      {selected.user?.name}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span className="text-violet-400 text-xs font-mono font-bold uppercase">
                      {getLang(selected.languageId)}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span className="text-gray-500 text-xs font-medium">
                      {new Date(selected.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(selected.status)}
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="relative flex-1 overflow-hidden group">
              <button
                onClick={() => handleCopy(selected.code)}
                className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-lg transition-all text-xs font-medium opacity-0 group-hover:opacity-100 shadow-xl"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Code"}
              </button>
              
              <div className="h-full overflow-auto p-6 bg-[#090c10] font-mono text-sm leading-relaxed text-blue-100/90 selection:bg-violet-500/30 selection:text-white">
                <pre className="whitespace-pre-wrap break-all">
                  {selected.code || "// No code stored."}
                </pre>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-white/8 bg-white/[0.02] flex items-center justify-end">
               <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Close
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
