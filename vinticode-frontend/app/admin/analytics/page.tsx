"use client";

import { useCallback, useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";
import { ErrorState, PageHeader } from "@/components/ui/states";
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

// ─────────────────────────────────────────────
// Skeleton card
// ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-16 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Stat card with trend indicator
// ─────────────────────────────────────────────
function AnalyticCard({
  label,
  value,
  icon: Icon,
  accent,
  sublabel,
  badge,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
  sublabel?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-border-strong transition-colors duration-200 group">
      <div className="flex items-start justify-between">
        {/* The icon inherits the accent's own foreground rather than being
            forced to text-foreground, which sat at near-zero contrast on the
            tinted (success/warning) accent chips. */}
        <div
          className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
        {badge && <div>{badge}</div>}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-foreground tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-muted-foreground text-sm mt-1">{label}</p>
        {sublabel && (
          <p className="text-muted-foreground text-xs mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────
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
        <div className="flex items-center gap-2 text-foreground">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground font-semibold">{value.toLocaleString()}</span>
          <span className="text-muted-foreground text-xs">({pct}%)</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Donut chart (CSS-based)
// ─────────────────────────────────────────────
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
      <div className="relative w-36 h-36">
        {/*
          Strokes were hardcoded #ffffff / #ef4444 / rgba(255,255,255,0.05).
          The accepted arc — the whole point of the chart — was pure white
          and therefore invisible on a white card in light mode, and the
          track vanished too. Driving them from tokens keeps the chart
          legible in both themes and consistent with the status colours
          used everywhere else.
        */}
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full -rotate-90"
          role="img"
          aria-label={`${pct}% of ${total} submissions accepted`}
        >
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="12"
          />
          {/* Rejected (full ring, revealed where accepted doesn't cover) */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--destructive)"
            strokeWidth="12"
            strokeOpacity="0.5"
            strokeDasharray={`${circumference}`}
            strokeLinecap="round"
          />
          {/* Accepted arc */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--success)"
            strokeWidth="12"
            strokeDasharray={`${acceptedDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-foreground">{pct}%</span>
          <span className="text-muted-foreground text-xs">Acceptance</span>
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-success" />
          <span className="text-muted-foreground">Accepted ({accepted})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-destructive/50" />
          <span className="text-muted-foreground">Rejected ({rejected})</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Platform Health score
// ─────────────────────────────────────────────
function HealthScore({ score }: { score: number }) {
  const color =
    score >= 70
      ? "text-success-fg"
      : score >= 40
      ? "text-warning-fg"
      : "text-destructive-fg";
  const label =
    score >= 70 ? "Healthy" : score >= 40 ? "Moderate" : "Needs Attention";

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center gap-3">
      <Activity className="w-6 h-6 text-muted-foreground" />
      <div className="text-center">
        <p className={`text-5xl font-bold ${color}`}>{score}</p>
        <p className="text-muted-foreground text-sm mt-1">Platform Health Score</p>
        <p className={`text-xs mt-1 ${color}`}>{label}</p>
      </div>
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
        <div
          className={`h-full rounded-full ${
            score >= 70
              ? "bg-success"
              : score >= 40
              ? "bg-warning"
              : "bg-destructive"
          }`}
          style={{ width: `${score}%`, transition: "width 1.2s ease-out" }}
        />
      </div>
      <p className="text-muted-foreground text-xs text-center">
        Based on acceptance rate, active users & question coverage
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Analytics Page
// ─────────────────────────────────────────────
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
      // The .then/.finally chain had no rejection handler, so a failed
      // request rendered every metric as a confident "0" — worse than an
      // error, because it looks like real data.
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
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <div className="h-7 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-muted rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
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
      ? Math.round(
          (stats.acceptedSubmissions / stats.totalSubmissions) * 100
        )
      : 0;

  // Health score formula
  const healthScore = Math.min(
    100,
    Math.round(
      (acceptanceRate * 0.5) +
        (Math.min(stats?.totalUsers ?? 0, 100) / 100) * 30 +
        (Math.min(stats?.totalQuestions ?? 0, 50) / 50) * 20
    )
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Platform-wide performance metrics and insights
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          accent="bg-muted text-muted-foreground"
          sublabel="Registered accounts"
        />
        <AnalyticCard
          label="Total Questions"
          value={stats?.totalQuestions ?? 0}
          icon={BookOpen}
          accent="bg-muted text-muted-foreground"
          sublabel="Available problems"
        />
        <AnalyticCard
          label="Total Submissions"
          value={stats?.totalSubmissions ?? 0}
          icon={FileCode2}
          accent="bg-muted text-muted-foreground"
          sublabel="Code submissions"
        />
        <AnalyticCard
          label="Acceptance Rate"
          value={`${acceptanceRate}%`}
          icon={Percent}
          accent="bg-success-subtle text-success-fg"
          sublabel="Across all submissions"
          badge={
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                acceptanceRate >= 60
                  ? "bg-success-subtle text-success-fg"
                  : "bg-warning-subtle text-warning-fg"
              }`}
            >
              {acceptanceRate >= 60 ? "Good" : "Low"}
            </span>
          }
        />
      </div>

      {/* Mid row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submission breakdown */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-foreground" />
            <h2 className="text-foreground font-semibold text-sm">
              Submission Breakdown
            </h2>
          </div>

          <div className="space-y-5">
            <ProgressBar
              label="Accepted Submissions"
              value={stats?.acceptedSubmissions ?? 0}
              total={stats?.totalSubmissions ?? 0}
              color="bg-success"
              icon={CheckCircle2}
            />
            <ProgressBar
              label="Rejected Submissions"
              value={stats?.rejectedSubmissions ?? 0}
              total={stats?.totalSubmissions ?? 0}
              color="bg-destructive"
              icon={XCircle}
            />
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border">
            {[
              {
                label: "Accepted",
                value: stats?.acceptedSubmissions ?? 0,
                color: "text-success-fg",
              },
              {
                label: "Rejected",
                value: stats?.rejectedSubmissions ?? 0,
                color: "text-destructive-fg",
              },
              {
                label: "Questions",
                value: stats?.totalQuestions ?? 0,
                color: "text-foreground",
              },
              {
                label: "Users",
                value: stats?.totalUsers ?? 0,
                color: "text-muted-foreground",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-xl font-bold ${color}`}>
                  {value.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-2 w-full">
            <BarChart3 className="w-4 h-4 text-foreground" />
            <h2 className="text-foreground font-semibold text-sm">
              Outcome Distribution
            </h2>
          </div>
          <DonutChart
            accepted={stats?.acceptedSubmissions ?? 0}
            rejected={stats?.rejectedSubmissions ?? 0}
            total={stats?.totalSubmissions ?? 0}
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health score */}
        <HealthScore score={healthScore} />

        {/* Key ratios */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-foreground" />
            <h2 className="text-foreground font-semibold text-sm">
              Platform Ratios
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Submissions / User",
                value:
                  stats && stats.totalUsers > 0
                    ? (
                        stats.totalSubmissions / stats.totalUsers
                      ).toFixed(1)
                    : "0",
                description: "Avg submissions per registered user",
                accent: "border-border bg-muted",
                textColor: "text-foreground",
              },
              {
                label: "Solved Rate",
                value: `${acceptanceRate}%`,
                description: "Global acceptance across all submissions",
                accent: "border-success/20 bg-success-subtle",
                textColor: "text-success-fg",
              },
              {
                label: "Questions / User",
                value:
                  stats && stats.totalUsers > 0
                    ? (
                        stats.totalQuestions / stats.totalUsers
                      ).toFixed(2)
                    : "0",
                description: "Available questions per registered user",
                accent: "border-border bg-muted",
                textColor: "text-foreground",
              },
            ].map(({ label, value, description, accent, textColor }) => (
              <div
                key={label}
                className={`rounded-xl border p-4 space-y-2 ${accent}`}
              >
                <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
                <p className="text-foreground text-sm font-medium">{label}</p>
                <p className="text-muted-foreground text-xs">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
