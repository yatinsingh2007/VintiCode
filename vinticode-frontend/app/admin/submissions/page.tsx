"use client";

import { useState, useEffect } from "react";
import adminApi from "@/lib/adminApi";
import TableSkeleton from "@/components/admin/TableSkeleton";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/states";
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
      <span className={`${base} bg-success-subtle text-success-fg border-success/20`}>
        <CheckCircle2 className="w-3 h-3" />
        Accepted
      </span>
    );
  return (
    <span className={`${base} bg-destructive-subtle text-destructive-fg border-destructive/20`}>
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
  const [error, setError] = useState(false);

  const fetchSubmissions = async (
    p = page,
    q = search,
    s = filterStatus
  ) => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminApi.get("/submissions", {
        params: { page: p, limit: 20, search: q, status: s || undefined },
      });
      setSubmissions(res.data.submissions ?? []);
      setPagination(res.data.pagination);
    } catch {
      // try/finally with no catch meant a failed request rejected silently
      // and left the previous (or empty) list on screen — a network error
      // was indistinguishable from "no submissions match".
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

  // Escape closes the code viewer. Click-outside was the only way out,
  // which leaves keyboard users stuck in the dialog.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // Prevent the page behind the modal scrolling under it.
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
    // Theming now lives once in layout.tsx so toasts follow the theme.
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Submissions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor code quality and platform activity
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-3 bg-card border border-border rounded-xl p-3 shadow-sm"
      >
        <div className="flex-1 min-w-48 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            aria-label="Search submissions by user or question"
            placeholder="Search by user or question…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
            className="cursor-pointer bg-card border border-border text-foreground text-sm rounded-lg px-3 py-1.5 outline-none transition-colors hover:border-border-strong focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">All Statuses</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        {/* Was a bare white button that ignored the shared Button styles,
            so it had no focus ring, no pressed state and its own height. */}
        <Button type="submit" size="sm">
          Apply
        </Button>
      </form>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
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
            /* The copy said "Try adjusting your filters" even when no filter
               was set — telling a first-time admin to adjust nothing. */
            <EmptyState
              icon={FileCode2}
              title={
                search || filterStatus
                  ? "No matching submissions"
                  : "No submissions yet"
              }
              description={
                search || filterStatus
                  ? "No submissions match your current search and filters."
                  : "Submissions will appear here once users start solving questions."
              }
              action={
                search || filterStatus ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setFilterStatus("");
                      setPage(1);
                      fetchSubmissions(1, "", "");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
              className="rounded-none border-0 bg-transparent"
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left bg-muted">
                  <th className="px-5 py-4 text-muted-foreground font-medium">User</th>
                  <th className="px-5 py-4 text-muted-foreground font-medium">Question</th>
                  <th className="px-5 py-4 text-muted-foreground font-medium">Status</th>
                  <th className="px-5 py-4 text-muted-foreground font-medium text-center">Language</th>
                  <th className="px-5 py-4 text-muted-foreground font-medium">Date</th>
                  <th className="px-5 py-4 text-muted-foreground font-medium text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {submissions.map((s) => (
                  <tr
                    key={s.id}
                    className="group transition-colors hover:bg-accent"
                  >
                    <td className="px-5 py-4">
                      <p className="text-foreground font-medium group-hover:text-foreground transition-colors">
                        {s.user?.name ?? "—"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {s.user?.email ?? ""}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-foreground max-w-xs truncate font-medium">
                        {s.question?.title ?? "—"}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        {s.question?.difficulty ?? ""}
                      </span>
                    </td>
                    <td className="px-5 py-4">{statusBadge(s.status)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="px-2 py-1 bg-muted border border-border rounded text-muted-foreground text-[10px] font-mono">
                        {getLang(s.languageId)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground text-xs">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground hover:text-foreground hover:bg-accent transition-all border border-transparent hover:border-border"
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
          <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted">
            <p className="text-muted-foreground text-xs font-medium">
              Showing <span className="text-foreground">{submissions.length}</span> of <span className="text-foreground">{pagination.total}</span> submissions
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-muted-foreground text-xs font-medium px-2">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 transition-all"
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
          className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelected(null)}
        >
          <div
            // Announced as a dialog rather than an anonymous div, and
            // labelled by its own heading. Escape-to-close is wired up in
            // an effect above — a click-outside-only modal traps keyboard users.
            role="dialog"
            aria-modal="true"
            aria-labelledby="submission-modal-title"
            className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-lg animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted border border-border-strong flex items-center justify-center shrink-0">
                  <FileCode2 className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3
                    id="submission-modal-title"
                    className="text-foreground font-semibold text-lg leading-tight"
                  >
                    {selected.question?.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-muted-foreground text-xs font-medium">
                      {selected.user?.name}
                    </span>
                    <span aria-hidden="true" className="w-1 h-1 rounded-full bg-border-strong" />
                    <span className="text-foreground text-xs font-mono font-semibold uppercase">
                      {getLang(selected.languageId)}
                    </span>
                    <span aria-hidden="true" className="w-1 h-1 rounded-full bg-border-strong" />
                    <span className="text-muted-foreground text-xs font-medium">
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
                  className="cursor-pointer p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            
            <div className="relative flex-1 overflow-hidden group">
              {/*
                Was opacity-0 until group-hover: invisible to keyboard users
                (who can focus it but see nothing) and unreachable on touch,
                which has no hover state at all. Now always visible, with
                hover only strengthening it.
              */}
              <button
                onClick={() => handleCopy(selected.code)}
                className="absolute top-4 right-4 z-10 flex cursor-pointer items-center gap-2 px-3 py-1.5 bg-card/90 border border-border hover:border-border-strong text-muted-foreground hover:text-foreground rounded-lg backdrop-blur-sm transition-colors text-xs font-medium shadow-sm"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-success-fg" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {copied ? "Copied!" : "Copy Code"}
              </button>

              <div className="h-full overflow-auto p-6 bg-elevated font-mono text-sm leading-relaxed text-foreground selection:bg-primary-subtle">
                <pre className="whitespace-pre-wrap break-all">
                  {selected.code || "// No code stored."}
                </pre>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-muted flex items-center justify-end">
               <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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
