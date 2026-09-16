"use client";

import { useState, useEffect } from "react";
import adminApi from "@/lib/adminApi";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { toast } from "react-hot-toast";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { PlayButton, A } from "@/components/playground";
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
  ChevronRight,
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
  const accepted = status === "accepted";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border-2 border-pg-border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-black"
      style={{ background: accepted ? A.lime : A.coral }}
    >
      {accepted ? <CheckCircle2 className="size-3" strokeWidth={3} /> : <XCircle className="size-3" strokeWidth={3} />}
      {accepted ? "Accepted" : "Rejected"}
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

  const [selected, setSelected] = useState<Submission | null>(null);
  const [error, setError] = useState(false);

  const fetchSubmissions = async (p = page, q = search, s = filterStatus) => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminApi.get("/submissions", {
        params: { page: p, limit: 20, search: q, status: s || undefined },
      });
      setSubmissions(res.data.submissions ?? []);
      setPagination(res.data.pagination);
    } catch {
      setError(true);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(page, search, filterStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selected]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubmissions(1, search, filterStatus);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-pg-text">Submissions</h1>
        <p className="mt-1 text-sm font-medium text-pg-text-muted">
          Monitor code quality and platform activity
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-3 rounded-2xl border-[3px] border-pg-border bg-pg-surface p-3"
      >
        <div className="flex min-w-48 flex-1 items-center gap-2">
          <Search className="size-4 shrink-0 text-pg-text-faint" />
          <input
            type="text"
            aria-label="Search submissions by user or question"
            placeholder="Search by user or question…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-pg-text placeholder:text-pg-text-faint outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-pg-text-faint" aria-hidden="true" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
            className="cursor-pointer rounded-lg border-[3px] border-pg-border bg-pg-surface px-3 py-1.5 text-sm font-semibold text-pg-text outline-none"
          >
            <option value="">All Statuses</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <PlayButton type="submit" fill={A.cyan} shadow="#0d0d11" text="#0a0a0d" className="!px-5 !py-1.5 text-sm">
          Apply
        </PlayButton>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border-[3px] border-pg-border bg-pg-surface">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-1">
              <TableSkeleton rows={10} cols={6} />
            </div>
          ) : error ? (
            <ErrorState
              title="Couldn't load submissions"
              description="The submission list failed to load. This is usually a temporary network issue."
              onRetry={() => fetchSubmissions(page, search, filterStatus)}
              className="rounded-none border-0"
            />
          ) : submissions.length === 0 ? (
            <EmptyState
              icon={FileCode2}
              title={search || filterStatus ? "No matching submissions" : "No submissions yet"}
              description={
                search || filterStatus
                  ? "No submissions match your current search and filters."
                  : "Submissions will appear here once users start solving questions."
              }
              action={
                search || filterStatus ? (
                  <PlayButton
                    fill="#0d0d11"
                    shadow={A.cyan}
                    text="#ffffff"
                    className="!px-4 !py-2 text-sm"
                    onClick={() => {
                      setSearch("");
                      setFilterStatus("");
                      setPage(1);
                      fetchSubmissions(1, "", "");
                    }}
                  >
                    Clear filters
                  </PlayButton>
                ) : undefined
              }
              className="rounded-none border-0 bg-transparent"
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-[3px] border-pg-border bg-pg-surface text-left">
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-pg-text-muted">User</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-pg-text-muted">Question</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-pg-text-muted">Status</th>
                  <th className="px-5 py-4 text-center text-xs font-bold uppercase tracking-wider text-pg-text-muted">Language</th>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-pg-text-muted">Date</th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-pg-text-muted">View</th>
                </tr>
              </thead>
              <tbody className="divide-y-[3px] divide-black/40">
                {submissions.map((s) => (
                  <tr key={s.id} className="group transition-colors hover:bg-pg-text/5">
                    <td className="px-5 py-4">
                      <p className="font-bold text-pg-text">{s.user?.name ?? "—"}</p>
                      <p className="text-xs font-medium text-pg-text-muted">{s.user?.email ?? ""}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-xs truncate font-bold text-pg-text">{s.question?.title ?? "—"}</p>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-pg-text-faint">
                        {s.question?.difficulty ?? ""}
                      </span>
                    </td>
                    <td className="px-5 py-4">{statusBadge(s.status)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="rounded-md border-2 border-pg-border bg-pg-surface px-2 py-1 font-mono text-[10px] font-bold text-pg-text-muted">
                        {getLang(s.languageId)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-pg-text-muted">
                      {new Date(s.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelected(s)}
                        className="inline-flex items-center gap-1.5 rounded-lg border-2 border-pg-border bg-pg-surface px-3 py-1.5 text-pg-text transition-colors hover:bg-[var(--pg-cyan)] hover:text-black"
                      >
                        <FileCode2 className="size-3.5" strokeWidth={2.5} />
                        <span className="text-xs font-bold">Code</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t-[3px] border-pg-border bg-pg-surface px-5 py-4">
            <p className="text-xs font-medium text-pg-text-muted">
              Showing <span className="font-bold text-pg-text">{submissions.length}</span> of{" "}
              <span className="font-bold text-pg-text">{pagination.total}</span> submissions
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border-2 border-transparent p-2 text-pg-text-muted transition-all hover:border-pg-border hover:bg-pg-text/5 hover:text-pg-text disabled:opacity-30"
              >
                <ChevronLeft className="size-4" strokeWidth={2.5} />
              </button>
              <span className="px-2 text-xs font-bold text-pg-text-muted">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border-2 border-transparent p-2 text-pg-text-muted transition-all hover:border-pg-border hover:bg-pg-text/5 hover:text-pg-text disabled:opacity-30"
              >
                <ChevronRight className="size-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Code viewer modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-modal-title"
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border-[3px] border-pg-border bg-pg-surface"
            style={{ boxShadow: "12px 12px 0 0 var(--pg-cyan)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-[3px] border-pg-border bg-pg-surface px-6 py-5">
              <div className="flex items-center gap-4">
                <div
                  className="grid size-10 shrink-0 place-items-center rounded-xl border-[3px] border-pg-border text-black"
                  style={{ background: A.cyan }}
                >
                  <FileCode2 className="size-5" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 id="submission-modal-title" className="text-lg font-extrabold leading-tight text-pg-text">
                    {selected.question?.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-medium text-pg-text-muted">{selected.user?.name}</span>
                    <span aria-hidden="true" className="size-1 rounded-full bg-pg-text/30" />
                    <span className="font-mono text-xs font-bold uppercase text-pg-text">
                      {getLang(selected.languageId)}
                    </span>
                    <span aria-hidden="true" className="size-1 rounded-full bg-pg-text/30" />
                    <span className="text-xs font-medium text-pg-text-muted">
                      {new Date(selected.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(selected.status)}
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close code viewer"
                  className="cursor-pointer rounded-lg p-2 text-pg-text-muted transition-colors hover:text-pg-text"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="group relative flex-1 overflow-hidden">
              <button
                onClick={() => handleCopy(selected.code)}
                className="absolute right-4 top-4 z-10 flex cursor-pointer items-center gap-2 rounded-lg border-2 border-pg-border bg-pg-surface px-3 py-1.5 text-xs font-bold text-pg-text transition-colors hover:bg-[var(--pg-lime)] hover:text-black"
              >
                {copied ? (
                  <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
                ) : (
                  <Copy className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                )}
                {copied ? "Copied!" : "Copy Code"}
              </button>

              <div className="h-full overflow-auto bg-pg-ink p-6 font-mono text-sm leading-relaxed text-pg-text">
                <pre className="whitespace-pre-wrap break-all">
                  {selected.code || "// No code stored."}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end border-t-[3px] border-pg-border bg-pg-surface px-6 py-4">
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg px-4 py-2 text-sm font-bold text-pg-text-muted transition-colors hover:text-pg-text"
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
