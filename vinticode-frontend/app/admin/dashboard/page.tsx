"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import adminApi from "@/lib/adminApi";
import { Badge, statusVariant, humanize } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState, PageHeader } from "@/components/ui/states";
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

/*
  Accents previously stepped bg-white/5 → /10 → /15 → /20 across the six
  cards. That reads as a meaningless brightness ramp: "Total Users" looked
  dimmer than "Total Submissions" for no reason, implying a hierarchy that
  doesn't exist. Now neutral metrics share one neutral treatment and only
  the outcome metrics (accepted/rejected) carry semantic colour.
*/
function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone?: "neutral" | "success" | "destructive" | "primary";
  hint?: string;
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-primary-subtle text-primary-fg",
    success: "bg-success-subtle text-success-fg",
    destructive: "bg-destructive-subtle text-destructive-fg",
  } as const;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-colors duration-150 hover:border-border-strong">
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        {/* tabular-nums stops the digits jittering as values update */}
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {label}
          {hint && <span className="text-muted-foreground/70"> · {hint}</span>}
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

/** Absolute timestamp for the tooltip — "3d ago" alone isn't auditable. */
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
    <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
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
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[86px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-xl xl:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
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
      // Without this the promise rejection left `loading` true forever and
      // the screen sat at a spinner with no message and no way to retry.
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
        <StatCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
        <StatCard label="Total Questions" value={stats?.totalQuestions ?? 0} icon={BookOpen} />
        <StatCard label="Total Submissions" value={stats?.totalSubmissions ?? 0} icon={FileCode2} />
        <StatCard
          label="Accepted"
          value={stats?.acceptedSubmissions ?? 0}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Rejected"
          value={stats?.rejectedSubmissions ?? 0}
          icon={XCircle}
          tone="destructive"
        />
        <StatCard
          label="Acceptance Rate"
          value={`${acceptanceRate}%`}
          icon={TrendingUp}
          tone="primary"
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
                className="rounded text-xs font-medium text-primary-fg transition-colors hover:text-primary hover:underline"
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
              <ul className="divide-y divide-border">
                {recentSubmissions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {s.question?.title ?? "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.user?.name ?? "Unknown"} · {s.user?.email ?? "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge variant={statusVariant(s.status)}>{humanize(s.status)}</Badge>
                      <time
                        dateTime={s.createdAt}
                        title={fullDate(s.createdAt)}
                        className="hidden w-16 text-right text-xs tabular-nums text-muted-foreground sm:block"
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
              className="rounded text-xs font-medium text-primary-fg transition-colors hover:text-primary hover:underline"
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
            <ul className="divide-y divide-border">
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle">
                    <span className="text-xs font-semibold text-primary-fg">
                      {u.name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <time
                    dateTime={u.createdAt}
                    title={fullDate(u.createdAt)}
                    className="shrink-0 text-xs tabular-nums text-muted-foreground"
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
