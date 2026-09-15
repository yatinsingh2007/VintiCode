"use client";

import { useCallback, useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";
import { ErrorState, PageHeader } from "@/components/ui/states";
import { A } from "@/components/playground";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileCode2,
  BookOpen,
  CheckCircle2,
  XCircle,
  Activity,
  Percent,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalQuestions: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border-[3px] border-black bg-[#141419] p-5">
      <div className="flex items-center gap-4">
        <div className="size-11 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-16 rounded bg-white/10" />
          <div className="h-3 w-24 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function AnalyticCard({
  label,
  value,
  icon: Icon,
  color = A.cyan,
  sublabel,
  badge,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color?: string;
  sublabel?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border-[3px] border-black bg-[#141419] p-5"
      style={{ boxShadow: `5px 5px 0 0 ${color}` }}
    >
      <div className="flex items-start justify-between">
        <div
          className="grid size-11 shrink-0 place-items-center rounded-xl border-[3px] border-black text-black"
          style={{ background: color }}
        >
          <Icon className="size-5" strokeWidth={2.5} aria-hidden="true" />
        </div>
        {badge && <div>{badge}</div>}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-black tracking-tight text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="mt-1 text-sm font-medium text-white/55">{label}</p>
        {sublabel && <p className="mt-0.5 text-xs font-medium text-white/40">{sublabel}</p>}
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  value,
  total,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: React.ElementType;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-white">
          <Icon className="size-3.5 text-white/50" strokeWidth={2.5} />
          <span className="font-semibold">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">{value.toLocaleString()}</span>
          <span className="text-xs font-medium text-white/50">({pct}%)</span>
        </div>
      </div>
      <div className="h-3 overflow-hidden rounded-full border-2 border-black bg-[#0d0d11]">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function DonutChart({
  accepted,
  rejected,
  total,
}: {
  accepted: number;
  rejected: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const circumference = 2 * Math.PI * 54; // r=54
  const acceptedDash = (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-36 w-36">
        <svg
          viewBox="0 0 120 120"
          className="h-full w-full -rotate-90"
          role="img"
          aria-label={`${pct}% of ${total} submissions accepted`}
        >
          <circle cx="60" cy="60" r="54" fill="none" stroke="#0d0d11" strokeWidth="12" />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--pg-coral)"
            strokeWidth="12"
            strokeOpacity="0.6"
            strokeDasharray={`${circumference}`}
            strokeLinecap="round"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--pg-lime)"
            strokeWidth="12"
            strokeDasharray={`${acceptedDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black tabular-nums text-white">{pct}%</span>
          <span className="text-xs font-medium text-white/50">Acceptance</span>
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-full border border-black" style={{ background: A.lime }} />
          <span className="font-medium text-white/60">Accepted ({accepted})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-full border border-black" style={{ background: A.coral }} />
          <span className="font-medium text-white/60">Rejected ({rejected})</span>
        </div>
      </div>
    </div>
  );
}

function HealthScore({ score }: { score: number }) {
  const color = score >= 70 ? A.lime : score >= 40 ? A.amber : A.coral;
  const label = score >= 70 ? "Healthy" : score >= 40 ? "Moderate" : "Needs Attention";

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl border-[3px] border-black bg-[#141419] p-6"
      style={{ boxShadow: `8px 8px 0 0 ${color}` }}
    >
      <Activity className="size-6 text-white/50" strokeWidth={2.5} />
      <div className="text-center">
        <p className="text-5xl font-black" style={{ color }}>
          {score}
        </p>
        <p className="mt-1 text-sm font-medium text-white/55">Platform Health Score</p>
        <p className="mt-1 text-xs font-bold" style={{ color }}>
          {label}
        </p>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full border-2 border-black bg-[#0d0d11]">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: color, transition: "width 1.2s ease-out" }}
        />
      </div>
      <p className="text-center text-xs font-medium text-white/40">
        Based on acceptance rate, active users & question coverage
      </p>
    </div>
  );
}

const panelClass = "rounded-2xl border-[3px] border-black bg-[#141419] p-6";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminApi.get("/dashboard");
      setStats(res.data.stats);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-white/10" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border-[3px] border-black bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <PageHeader
          title="Analytics"
          description="Platform-wide performance metrics and insights"
        />
        <ErrorState
          title="Couldn't load analytics"
          description="The platform metrics failed to load. Showing no data is safer than showing zeros."
          onRetry={load}
        />
      </div>
    );
  }

  const acceptanceRate =
    stats && stats.totalSubmissions > 0
      ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100)
      : 0;

  const healthScore = Math.min(
    100,
    Math.round(
      acceptanceRate * 0.5 +
        (Math.min(stats?.totalUsers ?? 0, 100) / 100) * 30 +
        (Math.min(stats?.totalQuestions ?? 0, 50) / 50) * 20
    )
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-white">Analytics</h1>
        <p className="mt-1 text-sm font-medium text-white/55">
          Platform-wide performance metrics and insights
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticCard label="Total Users" value={stats?.totalUsers ?? 0} icon={Users} color={A.cyan} sublabel="Registered accounts" />
        <AnalyticCard label="Total Questions" value={stats?.totalQuestions ?? 0} icon={BookOpen} color={A.indigo} sublabel="Available problems" />
        <AnalyticCard label="Total Submissions" value={stats?.totalSubmissions ?? 0} icon={FileCode2} color={A.amber} sublabel="Code submissions" />
        <AnalyticCard
          label="Acceptance Rate"
          value={`${acceptanceRate}%`}
          icon={Percent}
          color={A.lime}
          sublabel="Across all submissions"
          badge={
            <span
              className="rounded-md border-2 border-black px-2 py-0.5 font-mono text-xs font-bold uppercase text-black"
              style={{ background: acceptanceRate >= 60 ? A.lime : A.amber }}
            >
              {acceptanceRate >= 60 ? "Good" : "Low"}
            </span>
          }
        />
      </div>

      {/* Mid row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Submission breakdown */}
        <div className={`${panelClass} space-y-6 lg:col-span-2`}>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-white/60" strokeWidth={2.5} />
            <h2 className="text-sm font-extrabold text-white">Submission Breakdown</h2>
          </div>

          <div className="space-y-5">
            <ProgressBar
              label="Accepted Submissions"
              value={stats?.acceptedSubmissions ?? 0}
              total={stats?.totalSubmissions ?? 0}
              color={A.lime}
              icon={CheckCircle2}
            />
            <ProgressBar
              label="Rejected Submissions"
              value={stats?.rejectedSubmissions ?? 0}
              total={stats?.totalSubmissions ?? 0}
              color={A.coral}
              icon={XCircle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 border-t-[3px] border-black pt-4 sm:grid-cols-4">
            {[
              { label: "Accepted", value: stats?.acceptedSubmissions ?? 0, color: A.lime },
              { label: "Rejected", value: stats?.rejectedSubmissions ?? 0, color: A.coral },
              { label: "Questions", value: stats?.totalQuestions ?? 0, color: "#ffffff" },
              { label: "Users", value: stats?.totalUsers ?? 0, color: A.cyan },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-black" style={{ color }}>
                  {value.toLocaleString()}
                </p>
                <p className="mt-0.5 text-xs font-medium text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div className={`${panelClass} flex flex-col items-center justify-center gap-6`}>
          <div className="flex w-full items-center gap-2">
            <BarChart3 className="size-4 text-white/60" strokeWidth={2.5} />
            <h2 className="text-sm font-extrabold text-white">Outcome Distribution</h2>
          </div>
          <DonutChart
            accepted={stats?.acceptedSubmissions ?? 0}
            rejected={stats?.rejectedSubmissions ?? 0}
            total={stats?.totalSubmissions ?? 0}
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <HealthScore score={healthScore} />

        <div className={`${panelClass} lg:col-span-2`}>
          <div className="mb-5 flex items-center gap-2">
            <Activity className="size-4 text-white/60" strokeWidth={2.5} />
            <h2 className="text-sm font-extrabold text-white">Platform Ratios</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                label: "Submissions / User",
                value: stats && stats.totalUsers > 0 ? (stats.totalSubmissions / stats.totalUsers).toFixed(1) : "0",
                description: "Avg submissions per registered user",
                color: A.cyan,
              },
              {
                label: "Solved Rate",
                value: `${acceptanceRate}%`,
                description: "Global acceptance across all submissions",
                color: A.lime,
              },
              {
                label: "Questions / User",
                value: stats && stats.totalUsers > 0 ? (stats.totalQuestions / stats.totalUsers).toFixed(2) : "0",
                description: "Available questions per registered user",
                color: A.amber,
              },
            ].map(({ label, value, description, color }) => (
              <div
                key={label}
                className="space-y-2 rounded-xl border-[3px] border-black bg-[#0d0d11] p-4"
                style={{ boxShadow: `4px 4px 0 0 ${color}` }}
              >
                <p className="text-2xl font-black" style={{ color }}>
                  {value}
                </p>
                <p className="text-sm font-bold text-white">{label}</p>
                <p className="text-xs font-medium text-white/45">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
