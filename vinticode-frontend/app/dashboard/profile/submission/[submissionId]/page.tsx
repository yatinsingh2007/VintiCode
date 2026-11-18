"use client";

import { Editor } from "@monaco-editor/react";
import { useEffect, useState, useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import api from "@/lib/axios";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Calendar,
  Code2,
  Clock,
  Lock,
} from "lucide-react";
import {
  PlayScreen,
  PlayCard,
  PlayButton,
  IconTile,
  useGsapReveal,
  A,
} from "@/components/playground";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SubmissionData {
  id: string;
  userId: string;
  questionId: string;
  code: string;
  status: "accepted" | "rejected";
  languageId: number;
  createdAt: string;
  updatedAt: string;
}

const LANGUAGES: Record<number, { monaco: string; name: string }> = {
  54: { monaco: "cpp", name: "C++" },
  62: { monaco: "java", name: "Java" },
  71: { monaco: "python", name: "Python" },
  63: { monaco: "javascript", name: "JavaScript" },
};

const getLanguage = (id: number) =>
  LANGUAGES[id] ?? { monaco: "plaintext", name: "Unknown" };

export default function Submission() {
  const { submissionId } = useParams();
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get(`/questions/submission/${submissionId}`, {
          withCredentials: true,
        });
        setSubmissionData(resp.data);
      } catch (err: unknown) {
        console.error(err);
        setError("Failed to fetch submission data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [submissionId]);

  // GSAP: spring-stagger the content in once the data has loaded.
  const scope = useGsapReveal<HTMLDivElement>(!loading && !!submissionData);

  const backToProfile = () => router.push("/dashboard/profile");

  const header = (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <span
          className="inline-block -rotate-2 rounded-lg border-[3px] border-pg-border px-2.5 py-0.5 font-mono text-[0.7rem] font-bold uppercase tracking-wider text-black shadow-[3px_3px_0_0_#000]"
          style={{ background: A.cyan }}
        >
          Submission
        </span>
        <h1 className="mt-3 text-4xl font-black tracking-tighter">Submission Details</h1>
        <p className="mt-1 text-sm font-medium text-pg-text-muted">
          A read-only look at the code you submitted
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle
          size="icon-sm"
          className="border-[3px] border-pg-border bg-pg-surface"
        />
        <PlayButton
          onClick={backToProfile}
          fill="#141419"
          shadow={A.cyan}
          text="#ffffff"
          className="!px-4 !py-2 text-sm"
        >
          <ArrowLeft className="size-4" strokeWidth={3} /> Back to Profile
        </PlayButton>
      </div>
    </div>
  );

  if (loading) {
    return (
      <PlayScreen className="p-4 md:p-8">
        <div className="mx-auto w-full max-w-6xl">
          {header}
          <div className="w-full space-y-8">
            <div className="h-24 w-full animate-pulse rounded-2xl border-[3px] border-pg-border bg-pg-surface" />
            <div className="h-[70vh] w-full animate-pulse rounded-2xl border-[3px] border-pg-border bg-pg-surface" />
          </div>
        </div>
      </PlayScreen>
    );
  }

  if (error || !submissionData) {
    return (
      <PlayScreen className="p-4 md:p-8">
        <div className="mx-auto w-full max-w-6xl">
          {header}
          <PlayCard color={A.coral} offset={8} className="mx-auto max-w-2xl p-8 text-center">
            <div
              className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border-[3px] border-pg-border text-black"
              style={{ background: A.coral }}
            >
              <XCircle className="size-8" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              {error ? "Couldn't load this submission" : "Submission not found"}
            </h2>
            <p className="mt-2 text-sm font-medium text-pg-text-muted">
              {error || "The submission you're looking for doesn't exist."}
            </p>
            <PlayButton
              onClick={backToProfile}
              fill={A.lime}
              shadow={A.coral}
              className="mt-6"
            >
              <ArrowLeft className="size-4" strokeWidth={3} /> Back to Profile
            </PlayButton>
          </PlayCard>
        </div>
      </PlayScreen>
    );
  }

  const accepted = submissionData.status === "accepted";
  const statusColor = accepted ? A.lime : A.coral;
  const lang = getLanguage(submissionData.languageId);
  const created = new Date(submissionData.createdAt);

  return (
    <PlayScreen className="p-4 md:p-8">
      <div className="mx-auto w-full max-w-6xl">
        {header}

        <div ref={scope} className="w-full space-y-8">
          {/* Summary */}
          <PlayCard data-reveal color={statusColor} offset={8} className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span
                  className="grid size-14 shrink-0 place-items-center rounded-2xl border-[3px] border-pg-border text-black"
                  style={{ background: statusColor }}
                >
                  {accepted ? (
                    <CheckCircle2 className="size-7" strokeWidth={2.5} />
                  ) : (
                    <XCircle className="size-7" strokeWidth={2.5} />
                  )}
                </span>
                <div>
                  <p className="text-2xl font-extrabold tracking-tight">
                    {accepted ? "Accepted" : "Rejected"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-md border-2 border-pg-border px-2 py-0.5 font-mono text-[0.65rem] font-bold text-black"
                      style={{ background: A.indigo }}
                    >
                      <Code2 className="size-3" strokeWidth={3} />
                      {lang.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm font-bold sm:justify-end">
                <span className="flex items-center gap-2">
                  <Calendar className="size-4 text-pg-text-muted" />
                  {created.toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="size-4 text-pg-text-muted" />
                  {created.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </PlayCard>

          {/* Code */}
          <PlayCard data-reveal color={A.indigo} offset={8} className="overflow-hidden">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <IconTile icon={Code2} color={A.indigo} className="size-10" />
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Code</h2>
                  <p className="text-sm font-medium text-pg-text-muted">{lang.name}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg border-[3px] border-pg-border bg-pg-surface-2 px-3 py-1 font-mono text-xs font-bold">
                <Lock className="size-3.5" strokeWidth={2.5} /> Read-only
              </span>
            </div>
            <div className="border-t-[3px] border-pg-border bg-pg-ink">
              <Editor
                height="70vh"
                width="100%"
                value={submissionData.code}
                language={lang.monaco}
                theme={theme === "dark" ? "vs-dark" : "light"}
                options={{
                  readOnly: true,
                  domReadOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: "on",
                  wordWrap: "on",
                  automaticLayout: true,
                  padding: { top: 24, bottom: 24 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  scrollbar: {
                    useShadows: false,
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                  },
                }}
              />
            </div>
          </PlayCard>
        </div>
      </div>
    </PlayScreen>
  );
}
