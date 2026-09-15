"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import adminApi from "@/lib/adminApi";
import { Badge, statusVariant, humanize } from "@/components/ui/badge";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/states";
import { A } from "@/components/playground";
import {
  Users,
  BookOpen,
  FileCode2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  Inbox,
  UserPlus,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalQuestions: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
}

interface RecentSubmission {
  id: string;
  status: string;
  languageId: number;
  createdAt: string;
  user: { name: string; email: string };
  question: { title: string };
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = A.cyan,
  hint,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color?: string;
  hint?: string;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border-[3px] border-black bg-[#141419] p-5"
      style={{ boxShadow: `5px 5px 0 0 ${color}` }}
    >
      <div
        className="grid size-12 shrink-0 place-items-center rounded-xl border-[3px] border-black text-black"
        style={{ background: color }}
      >
        <Icon className="size-5" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black tabular-nums tracking-tight text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="mt-0.5 truncate text-xs font-medium text-white/55">
          {label}
          {hint && <span className="text-white/40"> · {hint}</span>}
        </p>
      </div>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function fullDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Panel({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-[#141419]">
      <div className="flex items-center gap-2 border-b-[3px] border-black px-5 py-3.5">
        <Icon className="size-4 text-white/50" strokeWidth={2.5} aria-hidden="true" />
        <h2 className="text-sm font-extrabold text-white">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-64 animate-pulse rounded bg-white/10" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[86px] animate-pulse rounded-2xl border-[3px] border-black bg-white/10" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl border-[3px] border-black bg-white/10 xl:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl border-[3px] border-black bg-white/10" />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminApi.get("/dashboard");
      setStats(res.data.stats);
      setRecentSubmissions(res.data.recentSubmissions ?? []);
      setRecentUsers(res.data.recentUsers ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader title="Dashboard" description="Platform overview and recent activity" />
        <ErrorState
          title="Couldn't load the dashboard"
          description="The platform stats failed to load. This is usually a temporary network issue."
          onRetry={load}
        />
      </div>
    );
  }

  const acceptanceRate =
    stats && stats.totalSubmissions > 0
      ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader title="Dashboard" description="Platform overview and recent activity" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color={A.cyan} />
        <StatCard label="Total Questions" value={stats?.totalQuestions ?? 0} icon={BookOpen} color={A.indigo} />
        <StatCard label="Total Submissions" value={stats?.totalSubmissions ?? 0} icon={FileCode2} color={A.amber} />
        <StatCard label="Accepted" value={stats?.acceptedSubmissions ?? 0} icon={CheckCircle2} color={A.lime} />
        <StatCard label="Rejected" value={stats?.rejectedSubmissions ?? 0} icon={XCircle} color={A.coral} />
        <StatCard
          label="Acceptance Rate"
          value={`${acceptanceRate}%`}
          icon={TrendingUp}
          color={A.lime}
          hint={`of ${(stats?.totalSubmissions ?? 0).toLocaleString()}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel
            title="Recent Submissions"
            icon={Clock}
            action={
              <Link
                href="/admin/submissions"
                className="rounded text-xs font-bold text-[var(--pg-lime)] transition-colors hover:underline"
              >
                View all
              </Link>
            }
          >
            {recentSubmissions.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No submissions yet"
                description="Submissions will appear here as soon as users start solving questions."
                className="rounded-none border-0 bg-transparent"
              />
            ) : (
              <ul className="divide-y-[3px] divide-black/40">
                {recentSubmissions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {s.question?.title ?? "—"}
                      </p>
                      <p className="truncate text-xs font-medium text-white/50">
                        {s.user?.name ?? "Unknown"} · {s.user?.email ?? "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant={statusVariant(s.status)}>{humanize(s.status)}</Badge>
                      <time
                        dateTime={s.createdAt}
                        title={fullDate(s.createdAt)}
                        className="hidden w-16 text-right text-xs font-medium tabular-nums text-white/50 sm:block"
                      >
                        {timeAgo(s.createdAt)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel
          title="Recent Users"
          icon={Users}
          action={
            <Link
              href="/admin/users"
              className="rounded text-xs font-bold text-[var(--pg-lime)] transition-colors hover:underline"
            >
              View all
            </Link>
          }
        >
          {recentUsers.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="No users yet"
              description="New sign-ups will show up here."
              className="rounded-none border-0 bg-transparent"
            />
          ) : (
            <ul className="divide-y-[3px] divide-black/40">
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/5"
                >
                  <div
                    className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-black text-black"
                    style={{ background: A.cyan }}
                  >
                    <span className="text-xs font-black">
                      {u.name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{u.name}</p>
                    <p className="truncate text-xs font-medium text-white/50">{u.email}</p>
                  </div>
                  <time
                    dateTime={u.createdAt}
                    title={fullDate(u.createdAt)}
                    className="shrink-0 text-xs font-medium tabular-nums text-white/50"
                  >
                    {timeAgo(u.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
