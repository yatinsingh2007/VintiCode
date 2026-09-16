"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import adminApi from "@/lib/adminApi";
import Link from "next/link";
import { ChevronLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { PlayCard, A } from "@/components/playground";

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
  const accepted = status === "accepted";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border-2 border-pg-border px-2 py-0.5 font-mono text-xs font-bold uppercase text-black"
      style={{ background: accepted ? A.lime : A.coral }}
    >
      {accepted ? <CheckCircle2 className="size-3" strokeWidth={3} /> : <XCircle className="size-3" strokeWidth={3} />}
      {accepted ? "Accepted" : "Rejected"}
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
        <Loader2 className="size-8 animate-spin text-pg-text" />
      </div>
    );

  if (!user)
    return (
      <div className="py-20 text-center font-medium text-pg-text-muted">User not found.</div>
    );

  const accepted = user.solvedQuestions.filter((s) => s.status === "accepted").length;
  const rejected = user.solvedQuestions.filter((s) => s.status === "rejected").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/users"
        className="flex w-fit items-center gap-1.5 text-sm font-bold text-pg-text-muted transition-colors hover:text-pg-text"
      >
        <ChevronLeft className="size-4" strokeWidth={2.5} />
        Back to Users
      </Link>

      {/* Profile card */}
      <PlayCard color={A.cyan} offset={8} className="flex items-center gap-5 p-6">
        <div
          className="grid size-14 shrink-0 place-items-center rounded-2xl border-[3px] border-pg-border text-black"
          style={{ background: A.lime }}
        >
          <span className="text-xl font-black">{user.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold text-pg-text">{user.name}</h1>
          <p className="text-sm font-medium text-pg-text-muted">{user.email}</p>
          <p className="mt-1 text-xs font-medium text-pg-text-faint">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 gap-6 text-center">
          <div>
            <p className="text-2xl font-black text-pg-lime-ink">{accepted}</p>
            <p className="text-xs font-medium text-pg-text-muted">Accepted</p>
          </div>
          <div>
            <p className="text-2xl font-black text-pg-coral-ink">{rejected}</p>
            <p className="text-xs font-medium text-pg-text-muted">Rejected</p>
          </div>
          <div>
            <p className="text-2xl font-black text-pg-text">{user.solvedQuestions.length}</p>
            <p className="text-xs font-medium text-pg-text-muted">Total</p>
          </div>
        </div>
      </PlayCard>

      {/* Submissions table */}
      <div className="overflow-hidden rounded-2xl border-[3px] border-pg-border bg-pg-surface">
        <div className="border-b-[3px] border-pg-border px-5 py-4">
          <h2 className="text-sm font-extrabold text-pg-text">Submission History</h2>
        </div>
        <div className="divide-y-[3px] divide-black/40">
          {user.solvedQuestions.length === 0 ? (
            <p className="py-10 text-center text-sm font-medium text-pg-text-muted">
              No submissions yet.
            </p>
          ) : (
            user.solvedQuestions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-pg-text/5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-pg-text">
                    {s.question?.title ?? "—"}
                  </p>
                  <p className="text-xs font-medium text-pg-text-muted">
                    Language ID: {s.languageId}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {statusBadge(s.status)}
                  <span className="text-xs font-medium text-pg-text-muted">
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
