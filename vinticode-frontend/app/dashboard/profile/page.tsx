"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import {
  User,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Calendar,
  FileCode,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  PlayScreen,
  PlayCard,
  PlayButton,
  IconTile,
  useGsapReveal,
  A,
} from "@/components/playground";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Submission {
  id: string;
  userId: string;
  questionId: string;
  code: string;
  status: "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
  question: questionData;
}

interface questionData {
  id: string;
  title: string;
  description: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  test_cases: [
    {
      input: string;
      output: string;
    }
  ];
  difficulty: string;
  createdAt: Date;
  updatedAt: Date;
  done: boolean;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

function diffColor(difficulty?: string) {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return A.lime;
    case "medium":
      return A.amber;
    case "hard":
      return A.coral;
    default:
      return A.cyan;
  }
}

export default function Profile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const [profileResp, submissionsResp] = await Promise.all([
          api.get("/userprofile", { withCredentials: true }),
          api.get("/userprofile/submissions", { withCredentials: true }),
        ]);

        setUserData(profileResp.data);
        setSubmissions(submissionsResp.data);
      } catch (err: unknown) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const acceptedCount = submissions.filter((s) => s.status === "accepted").length;
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length;
  const acceptanceRate =
    submissions.length > 0
      ? Math.round((acceptedCount / submissions.length) * 100)
      : 0;

  // GSAP: spring-stagger the content in once the data has loaded.
  const scope = useGsapReveal<HTMLDivElement>(!loading);

  const stats = [
    { label: "Accepted", value: acceptedCount, hint: "Successful submissions", icon: CheckCircle2, color: A.lime },
    { label: "Rejected", value: rejectedCount, hint: "Failed submissions", icon: XCircle, color: A.coral },
    { label: "Acceptance Rate", value: `${acceptanceRate}%`, hint: "Success percentage", icon: TrendingUp, color: A.cyan },
  ];

  return (
    <PlayScreen className="p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span
              className="inline-block -rotate-2 rounded-lg border-[3px] border-pg-border px-2.5 py-0.5 font-mono text-[0.7rem] font-bold uppercase tracking-wider text-black shadow-[3px_3px_0_0_#000]"
              style={{ background: A.amber }}
            >
              You
            </span>
            <h1 className="mt-3 text-4xl font-black tracking-tighter">Profile</h1>
            <p className="mt-1 text-sm font-medium text-pg-text-muted">
              Manage your profile and view your coding journey
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle
              size="icon-sm"
              className="border-[3px] border-pg-border bg-pg-surface"
            />
            <PlayButton
              onClick={() => router.push("/dashboard/home")}
              fill="#141419"
              shadow={A.cyan}
              text="#ffffff"
              className="!px-4 !py-2 text-sm"
            >
              <ArrowLeft className="size-4" strokeWidth={3} /> Back to Home
            </PlayButton>
          </div>
        </div>

        {loading ? (
          <div className="w-full space-y-8">
            <div className="h-28 w-full animate-pulse rounded-2xl border-[3px] border-pg-border bg-pg-surface" />
            <div className="grid w-full gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 w-full animate-pulse rounded-2xl border-[3px] border-pg-border bg-pg-surface" />
              ))}
            </div>
            <div className="h-64 w-full animate-pulse rounded-2xl border-[3px] border-pg-border bg-pg-surface" />
          </div>
        ) : (
          <div ref={scope} className="w-full space-y-8">
            {userData && (
              <PlayCard data-reveal color={A.lime} offset={8} className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className="grid size-16 shrink-0 place-items-center rounded-2xl border-[3px] border-pg-border text-black"
                    style={{ background: A.lime }}
                  >
                    <User className="size-8" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight">{userData.name}</h2>
                    <div className="mt-2 flex items-center gap-2 text-pg-text-muted">
                      <Mail className="size-4" />
                      <span className="text-sm font-medium">{userData.email}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-sm font-medium text-pg-text-muted">
                      <Calendar className="size-4" />
                      <span>
                        Joined{" "}
                        {new Date(userData.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </PlayCard>
            )}

            <div className="grid w-full gap-6 md:grid-cols-3">
              {stats.map((stat) => (
                <PlayCard
                  key={stat.label}
                  data-reveal
                  color={stat.color}
                  offset={6}
                  className="p-6"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="grid size-9 place-items-center rounded-lg border-[3px] border-pg-border text-black"
                      style={{ background: stat.color }}
                    >
                      <stat.icon className="size-5" strokeWidth={2.5} />
                    </span>
                    <span className="text-sm font-bold">{stat.label}</span>
                  </div>
                  <p className="mb-1 text-4xl font-black tabular-nums">{stat.value}</p>
                  <p className="text-xs font-medium text-pg-text-muted">{stat.hint}</p>
                </PlayCard>
              ))}
            </div>

            {/* Submissions */}
            <PlayCard data-reveal color={A.indigo} offset={8} className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconTile icon={FileCode} color={A.indigo} className="size-10" />
                  <div>
                    <h3 className="text-lg font-extrabold tracking-tight">Your Submissions</h3>
                    <p className="text-sm font-medium text-pg-text-muted">
                      View all your coding submissions
                    </p>
                  </div>
                </div>
                <span
                  className="rounded-lg border-[3px] border-pg-border px-3 py-1 font-mono text-sm font-bold text-black"
                  style={{ background: A.lime }}
                >
                  {submissions.length}
                </span>
              </div>

              <div className="space-y-3">
                {submissions.length > 0 ? (
                  submissions.map((s) => (
                    <div
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer rounded-xl border-[3px] border-pg-border bg-pg-surface p-4 transition-transform duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[5px_5px_0_0_var(--pg-cyan)]"
                      onClick={() => router.push(`/dashboard/profile/submission/${s.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          router.push(`/dashboard/profile/submission/${s.id}`);
                        }
                      }}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className="grid size-10 shrink-0 place-items-center rounded-lg border-[3px] border-pg-border text-black"
                            style={{ background: s.status === "accepted" ? A.lime : A.coral }}
                          >
                            {s.status === "accepted" ? (
                              <CheckCircle2 className="size-5" strokeWidth={2.5} />
                            ) : (
                              <XCircle className="size-5" strokeWidth={2.5} />
                            )}
                          </span>
                          <div>
                            <p className="font-extrabold">{s.question.title}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <span
                                className="inline-flex items-center rounded-md border-2 border-pg-border px-2 py-0.5 font-mono text-[0.65rem] font-bold text-black"
                                style={{ background: s.status === "accepted" ? A.lime : A.coral }}
                              >
                                {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                              </span>
                              {s.question.difficulty && (
                                <span
                                  className="inline-flex items-center rounded-md border-2 border-pg-border px-2 py-0.5 font-mono text-[0.65rem] font-bold text-black"
                                  style={{ background: diffColor(s.question.difficulty) }}
                                >
                                  {s.question.difficulty}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">
                            {new Date(s.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs font-medium text-pg-text-muted">
                            {new Date(s.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-4 grid size-16 place-items-center rounded-2xl border-[3px] border-pg-border bg-pg-surface">
                      <AlertCircle className="size-8 text-pg-text-faint" />
                    </div>
                    <p className="text-lg font-extrabold">No submissions yet</p>
                    <p className="mt-2 text-sm font-medium text-pg-text-muted">
                      Start solving problems to see your submissions here
                    </p>
                    <PlayButton
                      onClick={() => router.push("/dashboard/home")}
                      fill={A.lime}
                      shadow={A.coral}
                      className="mt-6"
                    >
                      Browse Questions
                    </PlayButton>
                  </div>
                )}
              </div>
            </PlayCard>
          </div>
        )}
      </div>
    </PlayScreen>
  );
}
