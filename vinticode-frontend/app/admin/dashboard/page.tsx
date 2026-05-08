"use client";

import { useEffect, useState } from "react";
import adminApi from "@/lib/adminApi";
import {
  Users,
  BookOpen,
  FileCode2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
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
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-[#161b22] border border-white/8 rounded-xl p-5 flex items-center gap-4 hover:border-white/15 transition-all duration-200">
      <div
        className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center shrink-0`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-gray-400 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const base = "px-2 py-0.5 rounded text-xs font-medium";
  if (status === "accepted")
    return <span className={`${base} bg-emerald-500/15 text-emerald-400`}>Accepted</span>;
  if (status === "rejected")
    return <span className={`${base} bg-red-500/15 text-red-400`}>Rejected</span>;
  return <span className={`${base} bg-yellow-500/15 text-yellow-400`}>{status}</span>;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get("/dashboard").then((res) => {
      setStats(res.data.stats);
      setRecentSubmissions(res.data.recentSubmissions);
      setRecentUsers(res.data.recentUsers);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const acceptanceRate = stats && stats.totalSubmissions > 0
    ? Math.round((stats.acceptedSubmissions / stats.totalSubmissions) * 100)
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          Platform overview and recent activity
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          accent="bg-blue-500/20"
        />
        <StatCard
          label="Total Questions"
          value={stats?.totalQuestions ?? 0}
          icon={BookOpen}
          accent="bg-violet-500/20"
        />
        <StatCard
          label="Total Submissions"
          value={stats?.totalSubmissions ?? 0}
          icon={FileCode2}
          accent="bg-indigo-500/20"
        />
        <StatCard
          label="Accepted"
          value={stats?.acceptedSubmissions ?? 0}
          icon={CheckCircle2}
          accent="bg-emerald-500/20"
        />
        <StatCard
          label="Rejected"
          value={stats?.rejectedSubmissions ?? 0}
          icon={XCircle}
          accent="bg-red-500/20"
        />
        <StatCard
          label="Acceptance Rate"
          value={`${acceptanceRate}%`}
          icon={TrendingUp}
          accent="bg-amber-500/20"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <div className="xl:col-span-2 bg-[#161b22] border border-white/8 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/8">
            <Clock className="w-4 h-4 text-violet-400" />
            <h2 className="text-white font-semibold text-sm">
              Recent Submissions
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {recentSubmissions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No submissions yet.
              </p>
            ) : (
              recentSubmissions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-white/3 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {s.question?.title ?? "—"}
                    </p>
                    <p className="text-gray-500 text-xs truncate">
                      {s.user?.name} · {s.user?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {statusBadge(s.status)}
                    <span className="text-gray-600 text-xs">
                      {timeAgo(s.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-[#161b22] border border-white/8 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/8">
            <Users className="w-4 h-4 text-blue-400" />
            <h2 className="text-white font-semibold text-sm">Recent Users</h2>
          </div>
          <div className="divide-y divide-white/5">
            {recentUsers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                No users yet.
              </p>
            ) : (
              recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {u.name}
                    </p>
                    <p className="text-gray-500 text-xs truncate">{u.email}</p>
                  </div>
                  <span className="text-gray-600 text-xs shrink-0">
                    {timeAgo(u.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
