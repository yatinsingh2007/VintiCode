"use client";

import Editor, { OnChange } from "@monaco-editor/react";
import { useParams, useRouter } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useContext, useEffect, useState } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import api from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle2, Play, Send, Terminal, AlertCircle, Save } from "lucide-react";
import { Confetti } from "@/components/magicui/confetti";
import { PlayButton, PlayCard, A } from "@/components/playground";
import { ThemeToggle } from "@/components/ThemeToggle";

interface submissionReportItem {
  verdict: string;
  input: string;
  output: string;
  expected: string;
}

interface languageDetails {
  language: string;
  id: number;
}

interface TestCases {
  input: string;
  output: string;
}

interface questionData {
  id: string;
  title: string;
  description: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  test_cases: TestCases[];
  difficulty: string;
  createdAt: Date;
  updatedAt: Date;
  done: boolean;
}

interface Output {
  stdout: string;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string;
  memory: number;
  token: string;
  status: {
    id: number;
    description: string;
  };
}

const languages: languageDetails[] = [
  { language: "python", id: 71 },
  { language: "cpp", id: 54 },
  { language: "java", id: 62 },
  { language: "javascript", id: 63 },
];

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

export default function Dashboard() {
  const { questionId } = useParams();
  const router = useRouter();

  const [testcaseStatus, setTestcaseStatus] = useState<
    ("pending" | "loading" | "accepted" | "failed")[]
  >([]);

  const [questionData, setQuestionData] = useState<questionData>({
    id: "",
    title: "",
    description: "",
    input_format: "",
    output_format: "",
    sample_input: "",
    sample_output: "",
    test_cases: [{ input: "", output: "" }],
    difficulty: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    done: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get(`/dashboard/question/${questionId}`, {
          withCredentials: true,
        });
        setQuestionData(resp.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load question. Please refresh.");
      }
    })();
  }, [questionId]);

  useEffect(() => {
    if (questionData.test_cases.length > 0) {
      setTestcaseStatus(questionData.test_cases.map(() => "pending"));
    }
  }, [questionData]);

  // Load saved playground first; fall back to latest submission code.
  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get(`/questions/playground/${questionId}`, {
          withCredentials: true,
        });
        if (resp.data?.code) setCode(resp.data.code);
        if (resp.data?.languageId) {
          const saved = languages.find((l) => l.id === resp.data.languageId);
          if (saved) setLanguage(saved);
        }
      } catch {
        // No playground yet — fall back to latest submission
        try {
          const resp = await api.get(`/questions/latestSubmission/${questionId}`, {
            withCredentials: true,
          });
          if (resp.data?.code) setCode(resp.data.code);
        } catch {
          // No submission either — blank editor is fine
        }
      }
    })();
  }, [questionId]);

  const [language, setLanguage] = useState<languageDetails>({
    language: "python",
    id: 71,
  });
  const [fontSize, setFontSize] = useState<number>(16);
  const [output, setOutput] = useState<Output>({
    stdout: "",
    stderr: "",
    compile_output: "",
    message: "",
    time: "",
    memory: 0,
    token: "",
    status: { id: 0, description: "" },
  });
  const [customInput, setCustomInput] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [rloader, setRloader] = useState<boolean>(false);
  const [sloader, setSloader] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [showBackDialog, setShowBackDialog] = useState<boolean>(false);
  const [saveLoader, setSaveLoader] = useState<boolean>(false);
  const { theme } = useContext(ThemeContext);

  const handleSavePlayground = async (): Promise<boolean> => {
    setSaveLoader(true);
    try {
      await api.put(`/questions/playground/${questionId}`, {
        code,
        languageId: language.id,
      });
      toast.success("Playground saved!");
      return true;
    } catch {
      toast.error("Failed to save playground");
      return false;
    } finally {
      setSaveLoader(false);
    }
  };

  const handleSaveAndLeave = async () => {
    const ok = await handleSavePlayground();
    if (ok) router.push("/dashboard/home");
  };

  const handleLeaveWithoutSaving = () => {
    // Delete the playground so next load shows latest submission or blank
    api.delete(`/questions/playground/${questionId}`).catch(() => {});
    router.push("/dashboard/home");
  };

  const handleRun = async () => {
    try {
      setRloader(true);
      setOutput({
        stdout: "",
        stderr: "",
        compile_output: "",
        message: "",
        time: "",
        memory: 0,
        token: "",
        status: { id: 0, description: "Processing..." },
      });

      const response = await api.post(
        `/questions/runCode/${questionData.id}`,
        {
          code,
          input: customInput,
          questionId,
          language_id: language.id,
        }
      );

      const submissionId = response.data.submissionId;
      const MAX_RETRIES = 20;
      let retries = 0;

      const pollResult = async () => {
        if (retries >= MAX_RETRIES) {
          setOutput((prev) => ({
            ...prev,
            status: { id: 1, description: "Timeout" },
            stderr: "Execution timed out. Please try again.",
          }));
          setRloader(false);
          return;
        }

        try {
          const resultResp = await api.get(`/questions/runCode/result/${submissionId}`);
          const data = resultResp.data;

          if (data.status === "processing") {
            retries++;
            setTimeout(pollResult, 1000);
          } else if (data.status === "completed") {
            const safeResult = {
              ...data.result,
              stdout:
                data.result.stdout && data.result.stdout.length > 3000
                  ? data.result.stdout.slice(0, 3000) +
                  "\n\n[Output truncated: too large]"
                  : data.result.stdout,
            };
            setOutput(safeResult);
            setRloader(false);
          } else if (data.status === "failed") {
            setOutput(prev => ({
              ...prev,
              stderr: data.result?.stderr || "Execution failed",
              status: { id: 1, description: "Error" }
            }));
            setRloader(false);
          } else {
            retries++;
            setTimeout(pollResult, 1000);
          }
        } catch (pollErr) {
          toast.error("Failed to fetch results");
          setRloader(false);
        }
      };
      setTimeout(pollResult, 1000);

    } catch (err: unknown) {
      console.error(err);
      setRloader(false);
      if (axios.isAxiosError(err)) {
        const errorData = err?.response?.data;
        if (errorData?.result) {
          setOutput(errorData.result);
        } else if (errorData?.error) {
          setOutput(prev => ({ ...prev, stderr: errorData.error, status: { id: 1, description: "Error" } }));
        } else {
          toast.error("Code execution failed");
        }
      } else {
        toast.error("Please try running the code again");
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setSloader(true);

      setTestcaseStatus((prev) => (prev || []).map(() => "loading"));

      const resp = await api.post(
        `/questions/submitCode/${questionData.id}`,
        {
          code,
          questionId,
          language_id: language.id,
        }
      );

      const submissionId = resp.data.submissionId;

      const MAX_RETRIES = 40;
      let retries = 0;

      const pollSubmission = async () => {
        if (retries >= MAX_RETRIES) {
          toast.error("Submission timed out");
          setSloader(false);
          setTestcaseStatus((prev) => (prev || []).map(() => "failed"));
          return;
        }

        try {
          const resultResp = await api.get(
            `/questions/submission/result/${submissionId}`
          );

          const data = resultResp.data;

          if (data.status === "processing" || data.status === "queued") {
            retries++;
            setTimeout(pollSubmission, 1000);
          }
          else if (data.status === "completed") {
            const result = data.result;

            const report =
              Array.isArray(result?.report) ? result.report : [];

            const newStatus = report.map((r: submissionReportItem) =>
              r.verdict === "AC" ? "accepted" : "failed"
            );

            setTestcaseStatus(newStatus);

            if (result?.verdict === "accepted") {
              toast.success("All Test Cases Passed!");
              setShowConfetti(true);
            } else {
              toast.error("Some Test Cases Failed");
            }

            setSloader(false);
          }
          else if (data.status === "failed") {
            toast.error("Submission failed to process");
            setTestcaseStatus((prev) => (prev || []).map(() => "failed"));
            setSloader(false);
          }
          else {
            retries++;
            setTimeout(pollSubmission, 1000);
          }
        }
        catch (pollErr) {
          console.error("Polling error:", pollErr);
          toast.error("Failed to fetch submission results");
          setSloader(false);
        }
      };

      setTimeout(pollSubmission, 1000);
    }
    catch (err) {
      console.error(err);
      setSloader(false);

      setTestcaseStatus((prev) => (prev || []).map(() => "pending"));

      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        toast.error(data?.error || "Submission failed!");
      } else {
        toast.error("Submission failed!");
      }
    }
  };

  const handleCodeChange: OnChange = (value) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleClearOutput = () => {
    setOutput({
      stdout: "",
      stderr: "",
      compile_output: "",
      message: "",
      time: "",
      memory: 0,
      token: "",
      status: { id: 0, description: "" },
    });
  };

  const btnBusy = "h-3 w-3 animate-spin rounded-full border-2 border-pg-border/50 border-t-transparent";

  return (
    <>
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      <PanelGroup
        direction="horizontal"
        className="fixed inset-0 z-50 h-dvh w-screen overflow-hidden bg-pg-ink bg-paper-grid font-sans text-pg-text"
      >
        {/* ── Problem panel ─────────────────────────────────────── */}
        <Panel defaultSize={40} minSize={25} className="flex flex-col border-r-[3px] border-pg-border bg-pg-surface">
          <div className="flex h-14 flex-none items-center gap-3 border-b-[3px] border-pg-border bg-pg-surface px-4">
            <button
              onClick={() => setShowBackDialog(true)}
              aria-label="Back"
              className="grid size-9 place-items-center rounded-xl border-[3px] border-pg-border bg-pg-surface text-pg-text transition-transform active:scale-95 hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <ArrowLeft className="size-4" strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-3 overflow-hidden">
              <h1 className="truncate text-sm font-extrabold tracking-tight">
                {questionData.title || "Loading Question..."}
              </h1>
              {questionData.done && (
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-md border-2 border-pg-border px-1.5 py-0.5 font-mono text-[0.6rem] font-bold uppercase text-black"
                  style={{ background: A.lime }}
                >
                  <CheckCircle2 className="size-3" strokeWidth={3} />
                  Solved
                </span>
              )}
            </div>

            <ThemeToggle
              size="icon-sm"
              className="ml-auto shrink-0 border-[3px] border-pg-border bg-pg-surface"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {questionData.title ? (
              <div className="mx-auto max-w-3xl space-y-10 pb-12">
                <div className="flex items-center gap-4">
                  <span
                    className="inline-flex items-center rounded-md border-2 border-pg-border px-2.5 py-1 font-mono text-xs font-bold uppercase text-black"
                    style={{ background: diffColor(questionData.difficulty) }}
                  >
                    {questionData.difficulty}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-pg-text-faint">
                    Memory Limit: 256MB
                  </span>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-black tracking-tight">Problem Statement</h2>
                  <p className="text-[15px] font-medium leading-relaxed text-pg-text-muted">
                    {questionData.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-pg-text-muted">Input Format</h3>
                    <div className="rounded-xl border-[3px] border-pg-border bg-pg-surface p-5 font-mono text-[13px] leading-relaxed text-pg-text">
                      {questionData.input_format}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-pg-text-muted">Output Format</h3>
                    <div className="rounded-xl border-[3px] border-pg-border bg-pg-surface p-5 font-mono text-[13px] leading-relaxed text-pg-text">
                      {questionData.output_format}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {[
                    { label: "Sample Input", value: questionData.sample_input, color: A.cyan },
                    { label: "Sample Output", value: questionData.sample_output, color: A.lime },
                  ].map((block) => (
                    <div key={block.label} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-pg-text-muted">{block.label}</h3>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(block.value || "");
                            toast.success(`Copied ${block.label.split(" ")[1]}`);
                          }}
                          className="rounded-md border-2 border-pg-border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-black transition-transform active:scale-95"
                          style={{ background: block.color }}
                        >
                          Copy
                        </button>
                      </div>
                      <div className="rounded-xl border-[3px] border-pg-border bg-pg-surface p-5 font-mono text-sm text-pg-text">
                        <pre className="whitespace-pre-wrap leading-relaxed">{block.value}</pre>
                      </div>
                    </div>
                  ))}
                </div>

                {questionData.test_cases.length > 0 && (
                  <div className="border-t-[3px] border-pg-border pt-10">
                    <h3 className="mb-6 px-1 text-sm font-black uppercase tracking-widest">Verification Status</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {questionData.test_cases.map((testCase, index) => {
                        const status = testcaseStatus[index];
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-xl border-[3px] border-pg-border bg-pg-surface p-4"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-pg-text-faint">Test Case</span>
                              <span className="text-sm font-extrabold">Case #0{index + 1}</span>
                            </div>
                            <div className="flex items-center">
                              {status === "pending" && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-pg-text-faint">Idle</span>
                              )}
                              {status === "loading" && (
                                <div className="flex items-center gap-2 text-pg-cyan-ink">
                                  <span className="animate-pulse text-[10px] font-bold uppercase tracking-widest">Running</span>
                                  <span className="size-3 animate-spin rounded-full border-2 border-[var(--pg-cyan)] border-t-transparent" />
                                </div>
                              )}
                              {status === "accepted" && (
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-md border-2 border-pg-border px-2 py-0.5 text-[10px] font-bold uppercase text-black"
                                  style={{ background: A.lime }}
                                >
                                  Passed
                                  <CheckCircle2 className="size-3.5" strokeWidth={3} />
                                </span>
                              )}
                              {status === "failed" && (
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-md border-2 border-pg-border px-2 py-0.5 text-[10px] font-bold uppercase text-black"
                                  style={{ background: A.coral }}
                                >
                                  Failed
                                  <AlertCircle className="size-3.5" strokeWidth={3} />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mx-auto mt-10 max-w-3xl space-y-8">
                <div className="h-6 w-20 animate-pulse rounded-lg bg-pg-text/10" />
                <div className="h-10 w-3/4 animate-pulse rounded-xl bg-pg-text/10" />
                <div className="space-y-4 pt-6">
                  <div className="h-4 w-full animate-pulse rounded bg-pg-text/10" />
                  <div className="h-4 w-full animate-pulse rounded bg-pg-text/10" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-pg-text/10" />
                </div>
                <div className="h-48 w-full animate-pulse rounded-2xl bg-pg-text/10" />
              </div>
            )}
          </div>
        </Panel>

        <PanelResizeHandle className="group relative z-50 flex w-1.5 items-center justify-center bg-pg-border transition-colors hover:bg-[var(--pg-lime)]">
          <div className="h-8 w-1 rounded-full bg-pg-text/20 transition-colors group-hover:bg-pg-border" />
        </PanelResizeHandle>

        <Panel defaultSize={60}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={65} minSize={30} className="flex flex-col bg-pg-ink">
              <div className="flex h-14 flex-none items-center justify-between border-b-[3px] border-pg-border bg-pg-surface px-4">
                <div className="flex items-center gap-1.5 rounded-xl border-[3px] border-pg-border bg-pg-surface p-1">
                  <Select
                    onValueChange={(value) => {
                      const selected = languages.find((lang) => lang.language === value);
                      if (selected) setLanguage(selected);
                    }}
                    value={language.language}
                  >
                    <SelectTrigger className="h-8 w-[130px] rounded-lg border-none bg-transparent text-[11px] font-bold uppercase tracking-widest text-pg-text focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[3px] border-pg-border bg-pg-surface">
                      {languages.map((lang) => (
                        <SelectItem key={lang.id} value={lang.language} className="text-[11px] font-bold uppercase tracking-widest">
                          {lang.language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="mx-1 h-4 w-px bg-pg-text/15" />

                  <Select
                    onValueChange={(value) => setFontSize(parseInt(value))}
                    value={fontSize.toString()}
                  >
                    <SelectTrigger className="h-8 w-[74px] rounded-lg border-none bg-transparent text-[11px] font-bold uppercase tracking-widest text-pg-text focus:ring-0">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent className="border-[3px] border-pg-border bg-pg-surface">
                      {[12, 14, 16, 18, 20, 22, 24].map((size) => (
                        <SelectItem key={size} value={size.toString()} className="text-[11px] font-bold tracking-widest">
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <PlayButton
                    onClick={handleSavePlayground}
                    disabled={saveLoader}
                    aria-busy={saveLoader}
                    fill="#0d0d11"
                    shadow={A.amber}
                    text="#ffffff"
                    className="!px-3 !py-1.5 text-xs"
                  >
                    {saveLoader ? <span aria-hidden className={btnBusy} /> : <Save className="size-3.5" strokeWidth={2.5} />}
                    Save
                  </PlayButton>

                  <PlayButton
                    onClick={handleRun}
                    disabled={rloader}
                    aria-busy={rloader}
                    fill="#0d0d11"
                    shadow={A.cyan}
                    text="#ffffff"
                    className="!px-3 !py-1.5 text-xs"
                  >
                    {rloader ? <span aria-hidden className={btnBusy} /> : <Play className="size-3.5" strokeWidth={2.5} />}
                    {rloader ? "Running…" : "Run"}
                  </PlayButton>

                  <PlayButton
                    onClick={handleSubmit}
                    disabled={sloader}
                    aria-busy={sloader}
                    fill={A.lime}
                    shadow={A.coral}
                    className="!px-3 !py-1.5 text-xs"
                  >
                    {sloader ? <span aria-hidden className={btnBusy} /> : <Send className="size-3.5" strokeWidth={2.5} />}
                    {sloader ? "Submitting…" : "Submit"}
                  </PlayButton>
                </div>
              </div>

              <div className="relative flex-1 border-t-[3px] border-pg-border bg-pg-ink">
                <Editor
                  height="100%"
                  language={language.language}
                  theme={theme === "dark" ? "vs-dark" : "light"}
                  value={code}
                  onChange={handleCodeChange}
                  options={{
                    fontSize,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    padding: { top: 24, bottom: 24 },
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    lineNumbers: "on",
                    renderLineHighlight: "all",
                    scrollbar: {
                      vertical: "visible",
                      horizontal: "visible",
                      useShadows: false,
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10,
                    },
                  }}
                />
              </div>
            </Panel>

            <PanelResizeHandle className="group relative z-50 flex h-1.5 items-center justify-center bg-pg-border transition-colors hover:bg-[var(--pg-lime)]">
              <div className="h-1 w-8 rounded-full bg-pg-text/20 transition-colors group-hover:bg-pg-border" />
            </PanelResizeHandle>

            <Panel defaultSize={35} minSize={20} className="flex flex-col bg-pg-ink">
              <div className="flex h-12 flex-none items-center justify-between border-b-[3px] border-pg-border bg-pg-surface px-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-pg-cyan-ink">
                    <Terminal className="size-4" strokeWidth={2.5} />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Console</span>
                  </div>

                  {output?.status?.id !== 0 && (
                    <div className="flex items-center gap-4 border-l-[3px] border-pg-border pl-6">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold uppercase tracking-tighter text-pg-text-faint">Status</span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            color:
                              output?.status?.id === 3 ? A.lime :
                              output?.status?.id === 4 ? A.coral :
                              output?.status?.id === 5 ? A.amber : A.cyan,
                          }}
                        >
                          {output?.status?.description}
                        </span>
                      </div>

                      {output.time && (
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold uppercase tracking-tighter text-pg-text-faint">Time</span>
                          <span className="text-[10px] font-bold tabular-nums tracking-wider text-pg-text-muted">{output.time}s</span>
                        </div>
                      )}

                      {output.memory && (
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold uppercase tracking-tighter text-pg-text-faint">Memory</span>
                          <span className="text-[10px] font-bold tabular-nums tracking-wider text-pg-text-muted">{(output.memory / 1024).toFixed(1)}MB</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleClearOutput}
                  className="rounded-lg border-2 border-pg-border bg-pg-surface px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-pg-text-muted transition-colors hover:text-pg-text"
                >
                  Clear
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden bg-pg-ink">
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-4xl">
                      {output.stderr ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-pg-coral-ink">
                            <AlertCircle className="size-3.5" strokeWidth={3} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Runtime Error</span>
                          </div>
                          <pre className="whitespace-pre-wrap break-all rounded-xl border-[3px] border-pg-border bg-pg-surface p-4 font-mono text-[13px] leading-relaxed text-pg-coral-ink">
                            {output.stderr}
                          </pre>
                        </div>
                      ) : output.compile_output ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-pg-amber-ink">
                            <AlertCircle className="size-3.5" strokeWidth={3} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Compilation Error</span>
                          </div>
                          <pre className="whitespace-pre-wrap break-all rounded-xl border-[3px] border-pg-border bg-pg-surface p-4 font-mono text-[13px] leading-relaxed text-pg-amber-ink">
                            {output.compile_output}
                          </pre>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-pg-text-muted">Standard Output</span>
                          {output.stdout ? (
                            <pre className="whitespace-pre-wrap break-all font-mono text-[14px] leading-relaxed text-pg-text">
                              {output.stdout}
                            </pre>
                          ) : (
                            <div className="pointer-events-none flex flex-col items-center justify-center py-12 opacity-30">
                              <Terminal className="mb-3 size-10 text-pg-text-faint" />
                              <p className="text-xs font-bold uppercase tracking-widest">Console Ready</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex w-[320px] flex-col border-l-[3px] border-pg-border bg-pg-surface">
                  <div className="flex h-10 flex-none items-center border-b-[3px] border-pg-border bg-pg-surface px-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-pg-text-muted">Test Input</span>
                  </div>
                  <div className="group relative flex-1">
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="absolute inset-0 h-full w-full resize-none bg-transparent p-6 font-mono text-[13px] text-pg-text placeholder:text-pg-text-faint focus:outline-none"
                      placeholder="Enter process input..."
                      spellCheck={false}
                    />
                    <div className="absolute bottom-4 right-4 text-[9px] font-bold uppercase tracking-tighter text-pg-text-faint transition-colors group-focus-within:text-pg-cyan-ink">
                      Editable Stdin
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>

      {/* Back-navigation warning dialog */}
      {showBackDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBackDialog(false)}
          />
          <PlayCard color={A.coral} offset={10} className="relative z-10 mx-4 w-full max-w-sm space-y-4 p-6">
            <div className="space-y-1.5">
              <h2 className="text-lg font-black tracking-tight text-pg-text">Leave without saving?</h2>
              <p className="text-sm font-medium leading-relaxed text-pg-text-muted">
                Your current code hasn&apos;t been saved to the playground. Save it so it&apos;s restored the next time you open this question.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <PlayButton
                onClick={handleLeaveWithoutSaving}
                fill="#0d0d11"
                shadow={A.cyan}
                text="#ffffff"
                className="!px-4 !py-2 text-sm"
              >
                Leave
              </PlayButton>
              <PlayButton
                onClick={handleSaveAndLeave}
                disabled={saveLoader}
                aria-busy={saveLoader}
                fill={A.lime}
                shadow={A.coral}
                className="!px-4 !py-2 text-sm"
              >
                {saveLoader ? <span aria-hidden className={btnBusy} /> : <Save className="size-3.5" strokeWidth={2.5} />}
                Save &amp; Leave
              </PlayButton>
            </div>
          </PlayCard>
        </div>
      )}
    </>
  );
}
