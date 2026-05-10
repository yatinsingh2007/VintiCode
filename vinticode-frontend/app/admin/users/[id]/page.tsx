"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import adminApi from "@/lib/adminApi";
import Link from "next/link";
import { ChevronLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Submission {
  id: string;
  status: string;
  languageId: number;
  createdAt: string;
  question: { id: string; title: string; difficulty: string };
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  solvedQuestions: Submission[];
}

function statusBadge(status: string) {
  const base = "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium";
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

export default function UserDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    adminApi
      .get(`/users/${id}`)
      .then((res) => setUser(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );

  if (!user)
    return (
      <div className="text-center py-20 text-gray-500">User not found.</div>
    );

  const accepted = user.solvedQuestions.filter(
    (s) => s.status === "accepted"
  ).length;
  const rejected = user.solvedQuestions.filter(
    (s) => s.status === "rejected"
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/users"
        className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Users
      </Link>

      {/* Profile card */}
      <div className="bg-[#161b22] border border-white/8 rounded-xl p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0">
          <span className="text-black text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-white text-xl font-bold">{user.name}</h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
          <p className="text-gray-600 text-xs mt-1">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-6 text-center shrink-0">
          <div>
            <p className="text-2xl font-bold text-emerald-400">{accepted}</p>
            <p className="text-gray-500 text-xs">Accepted</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{rejected}</p>
            <p className="text-gray-500 text-xs">Rejected</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {user.solvedQuestions.length}
            </p>
            <p className="text-gray-500 text-xs">Total</p>
          </div>
        </div>
      </div>

      {/* Submissions table */}
      <div className="bg-[#161b22] border border-white/8 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">
            Submission History
          </h2>
        </div>
        <div className="divide-y divide-white/5">
          {user.solvedQuestions.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">
              No submissions yet.
            </p>
          ) : (
            user.solvedQuestions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-white/3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {s.question?.title ?? "—"}
                  </p>
                  <p className="text-gray-600 text-xs">
                    Language ID: {s.languageId}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {statusBadge(s.status)}
                  <span className="text-gray-600 text-xs">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
