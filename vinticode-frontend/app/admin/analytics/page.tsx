"use client";

import { useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";
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
    <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-16 bg-white/5 rounded" />
          <div className="h-3 w-24 bg-white/5 rounded" />
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
    <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div
          className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {badge && <div>{badge}</div>}
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-white tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-gray-400 text-sm mt-1">{label}</p>
        {sublabel && (
          <p className="text-gray-600 text-xs mt-0.5">{sublabel}</p>
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
        <div className="flex items-center gap-2 text-gray-300">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">{value.toLocaleString()}</span>
          <span className="text-gray-600 text-xs">({pct}%)</span>
        </div>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
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
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
          />
          {/* Rejected arc */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#ef4444"
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
            stroke="#8b5cf6"
            strokeWidth="12"
            strokeDasharray={`${acceptedDash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{pct}%</span>
          <span className="text-gray-500 text-xs">Acceptance</span>
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-gray-400">Accepted ({accepted})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500/50" />
          <span className="text-gray-400">Rejected ({rejected})</span>
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
      ? "text-emerald-400"
      : score >= 40
      ? "text-amber-400"
      : "text-red-400";
  const label =
    score >= 70 ? "Healthy" : score >= 40 ? "Moderate" : "Needs Attention";

  return (
    <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-6 flex flex-col items-center gap-3">
      <Activity className="w-6 h-6 text-gray-500" />
      <div className="text-center">
        <p className={`text-5xl font-bold ${color}`}>{score}</p>
        <p className="text-gray-400 text-sm mt-1">Platform Health Score</p>
        <p className={`text-xs mt-1 ${color}`}>{label}</p>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
        <div
          className={`h-full rounded-full ${
            score >= 70
              ? "bg-emerald-500"
              : score >= 40
              ? "bg-amber-500"
              : "bg-red-500"
          }`}
          style={{ width: `${score}%`, transition: "width 1.2s ease-out" }}
        />
      </div>
      <p className="text-gray-600 text-xs text-center">
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

  useEffect(() => {
    adminApi
      .get("/dashboard")
      .then((res) => setStats(res.data.stats))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <div className="h-7 w-32 bg-white/5 rounded animate-pulse" />
          <div className="h-4 w-48 bg-white/5 rounded animate-pulse mt-2" />
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
              className="h-64 bg-white/5 rounded-xl animate-pulse"
            />
          ))}
        </div>
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
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">
          Platform-wide performance metrics and insights
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          accent="bg-blue-500/20"
          sublabel="Registered accounts"
        />
        <AnalyticCard
          label="Total Questions"
          value={stats?.totalQuestions ?? 0}
          icon={BookOpen}
          accent="bg-violet-500/20"
          sublabel="Available problems"
        />
        <AnalyticCard
          label="Total Submissions"
          value={stats?.totalSubmissions ?? 0}
          icon={FileCode2}
          accent="bg-indigo-500/20"
          sublabel="Code submissions"
        />
        <AnalyticCard
          label="Acceptance Rate"
          value={`${acceptanceRate}%`}
          icon={Percent}
          accent="bg-emerald-500/20"
          sublabel="Across all submissions"
          badge={
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                acceptanceRate >= 60
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
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
        <div className="lg:col-span-2 bg-[#161b22] border border-white/[0.06] rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <h2 className="text-white font-semibold text-sm">
              Submission Breakdown
            </h2>
          </div>

          <div className="space-y-5">
            <ProgressBar
              label="Accepted Submissions"
              value={stats?.acceptedSubmissions ?? 0}
              total={stats?.totalSubmissions ?? 0}
              color="bg-violet-500"
              icon={CheckCircle2}
            />
            <ProgressBar
              label="Rejected Submissions"
              value={stats?.rejectedSubmissions ?? 0}
              total={stats?.totalSubmissions ?? 0}
              color="bg-red-500/60"
              icon={XCircle}
            />
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/[0.06]">
            {[
              {
                label: "Accepted",
                value: stats?.acceptedSubmissions ?? 0,
                color: "text-emerald-400",
              },
              {
                label: "Rejected",
                value: stats?.rejectedSubmissions ?? 0,
                color: "text-red-400",
              },
              {
                label: "Questions",
                value: stats?.totalQuestions ?? 0,
                color: "text-violet-400",
              },
              {
                label: "Users",
                value: stats?.totalUsers ?? 0,
                color: "text-blue-400",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={`text-xl font-bold ${color}`}>
                  {value.toLocaleString()}
                </p>
                <p className="text-gray-600 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-[#161b22] border border-white/[0.06] rounded-xl p-6 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-2 w-full">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <h2 className="text-white font-semibold text-sm">
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
        <div className="lg:col-span-2 bg-[#161b22] border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-violet-400" />
            <h2 className="text-white font-semibold text-sm">
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
                accent: "border-violet-500/20 bg-violet-500/5",
                textColor: "text-violet-400",
              },
              {
                label: "Solved Rate",
                value: `${acceptanceRate}%`,
                description: "Global acceptance across all submissions",
                accent: "border-emerald-500/20 bg-emerald-500/5",
                textColor: "text-emerald-400",
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
                accent: "border-blue-500/20 bg-blue-500/5",
                textColor: "text-blue-400",
              },
            ].map(({ label, value, description, accent, textColor }) => (
              <div
                key={label}
                className={`rounded-xl border p-4 space-y-2 ${accent}`}
              >
                <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
                <p className="text-gray-300 text-sm font-medium">{label}</p>
                <p className="text-gray-600 text-xs">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
