"use client";

import Editor, { OnChange } from "@monaco-editor/react";
import { useParams, useRouter } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle2, Play, Send, Terminal, AlertCircle } from "lucide-react";

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

export default function Dashboard() {
  const { questionId } = useParams();
  const router = useRouter();

  const [submissionOutput, setSubmissionOutput] = useState<string[]>([]);

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

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get(`/questions/latestSubmission/${questionId}`, {
          withCredentials: true,
        });
        setCode(resp.data?.code);
      } catch (err) {
        console.log(err);
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

  const languages: languageDetails[] = [
    { language: "python", id: 71 },
    { language: "cpp", id: 54 },
    { language: "java", id: 62 },
    { language: "javascript", id: 63 },
  ];

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

  return (
    <PanelGroup direction="horizontal" className="fixed inset-0 h-dvh w-screen bg-neutral-950 text-neutral-200 overflow-hidden z-50 font-sans selection:bg-indigo-500/30">
      <Panel defaultSize={40} minSize={25} className="flex flex-col border-r border-white/5 bg-neutral-950/50 backdrop-blur-xl">
        <div className="flex-none h-14 flex items-center gap-4 px-6 border-b border-white/5 bg-neutral-900/20 backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-white/5 text-neutral-400 hover:text-white transition-all duration-300 active:scale-95"
            onClick={() => router.push("/dashboard/home")}
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>

          <div className="flex flex-col gap-0.5 overflow-hidden">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-sm font-semibold tracking-tight text-white/90">
                {questionData.title || "Loading Question..."}
              </h1>
              {questionData.done && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Solved</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
          {questionData.title ? (
            <div className="space-y-10 max-w-3xl mx-auto pb-12">
              <div className="flex items-center gap-4">
                <span
                  className={`${questionData.difficulty === "Easy"
                    ? "text-emerald-400 bg-emerald-400/5 ring-emerald-400/20"
                    : questionData.difficulty === "Medium"
                      ? "text-amber-400 bg-amber-400/5 ring-amber-400/20"
                      : "text-rose-400 bg-rose-400/5 ring-rose-400/20"
                    } inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset`}
                >
                  {questionData.difficulty}
                </span>
                <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-widest">
                  Memory Limit: 256MB
                </span>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-white">Problem Statement</h2>
                <div className="prose prose-invert prose-sm max-w-none prose-p:text-neutral-400 prose-p:leading-relaxed prose-headings:text-neutral-100 prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl">
                  <p className="text-[15px] leading-relaxed">{questionData.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-indigo-400/70">Input Format</h3>
                  <div className="p-5 rounded-xl bg-white/[0.02] text-[13px] text-neutral-300 font-mono leading-relaxed border border-white/5 hover:border-white/10 transition-colors">
                    {questionData.input_format}
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-indigo-400/70">Output Format</h3>
                  <div className="p-5 rounded-xl bg-white/[0.02] text-[13px] text-neutral-300 font-mono leading-relaxed border border-white/5 hover:border-white/10 transition-colors">
                    {questionData.output_format}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-indigo-400/70">Sample Input</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-3 text-[10px] uppercase font-bold tracking-widest hover:bg-white/5 text-neutral-500 hover:text-white transition-all"
                      onClick={() => {
                        navigator.clipboard.writeText(questionData.sample_input || "");
                        toast.success("Copied Input");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="p-5 rounded-xl bg-white/[0.03] text-sm text-neutral-300 font-mono border border-white/5 shadow-inner">
                    <pre className="whitespace-pre-wrap leading-relaxed">{questionData.sample_input}</pre>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-indigo-400/70">Sample Output</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-3 text-[10px] uppercase font-bold tracking-widest hover:bg-white/5 text-neutral-500 hover:text-white transition-all"
                      onClick={() => {
                        navigator.clipboard.writeText(questionData.sample_output || "");
                        toast.success("Copied Output");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="p-5 rounded-xl bg-white/[0.03] text-sm text-neutral-300 font-mono border border-white/5 shadow-inner">
                    <pre className="whitespace-pre-wrap leading-relaxed">{questionData.sample_output}</pre>
                  </div>
                </div>
              </div>

              {questionData.test_cases.length > 0 && (
                <div className="pt-10 border-t border-white/5">
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-widest mb-6 px-1">Verification Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {questionData.test_cases.map((testCase, index) => {
                      const status = testcaseStatus[index];
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 group"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-neutral-500 group-hover:text-neutral-400 uppercase tracking-widest transition-colors">Test Case</span>
                            <span className="text-sm font-semibold text-neutral-300">Case #0{index + 1}</span>
                          </div>
                          <div className="flex items-center">
                            {status === "pending" && (
                              <span className="text-[10px] text-neutral-600 font-bold tracking-widest uppercase">Idle</span>
                            )}
                            {status === "loading" && (
                              <div className="flex items-center gap-2 text-indigo-400">
                                <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Running</span>
                                <span className="h-3 w-3 animate-spin rounded-full border border-indigo-400 border-t-transparent"></span>
                              </div>
                            )}
                            {status === "accepted" && (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Passed</span>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              </div>
                            )}
                            {status === "failed" && (
                              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Failed</span>
                                <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                              </div>
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
            <div className="space-y-8 max-w-3xl mx-auto mt-10">
              <Skeleton className="h-6 w-20 bg-white/5 rounded-full" />
              <Skeleton className="h-10 w-3/4 bg-white/5 rounded-xl" />
              <div className="space-y-4 pt-6">
                <Skeleton className="h-4 w-full bg-white/5 rounded-md" />
                <Skeleton className="h-4 w-full bg-white/5 rounded-md" />
                <Skeleton className="h-4 w-2/3 bg-white/5 rounded-md" />
              </div>
              <Skeleton className="h-48 w-full bg-white/5 rounded-2xl" />
            </div>
          )}
        </div>
      </Panel>

      <PanelResizeHandle className="w-1.5 flex items-center justify-center group bg-black/40 hover:bg-indigo-500/50 transition-all duration-300 relative z-50">
        <div className="h-8 w-1 rounded-full bg-white/10 group-hover:bg-white/40 transition-colors" />
      </PanelResizeHandle>

      <Panel defaultSize={60}>
        <PanelGroup direction="vertical">
          <Panel defaultSize={65} minSize={30} className="flex flex-col bg-[#0d0d0d]">
            <div className="flex-none h-14 flex items-center justify-between px-6 border-b border-white/5 bg-neutral-900/40 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
                  <Select
                    onValueChange={(value) => {
                      const selected = languages.find((lang) => lang.language === value);
                      if (selected) setLanguage(selected);
                    }}
                    value={language.language}
                  >
                    <SelectTrigger className="h-8 w-[140px] border-none bg-transparent hover:bg-white/5 text-[11px] font-bold uppercase tracking-widest text-neutral-300 focus:ring-0 rounded-lg transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/5 bg-neutral-900 text-neutral-300 backdrop-blur-xl">
                      {languages.map((lang) => (
                        <SelectItem key={lang.id} value={lang.language} className="text-[11px] font-bold uppercase tracking-widest hover:bg-indigo-500/10 focus:bg-indigo-500/20 cursor-pointer">
                          {lang.language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="w-[1px] h-4 bg-white/10 mx-1" />

                  <Select
                    onValueChange={(value) => setFontSize(parseInt(value))}
                    value={fontSize.toString()}
                  >
                    <SelectTrigger className="h-8 w-[80px] border-none bg-transparent hover:bg-white/5 text-[11px] font-bold uppercase tracking-widest text-neutral-300 focus:ring-0 rounded-lg transition-all">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent className="border-white/5 bg-neutral-900 text-neutral-300 backdrop-blur-xl">
                      {[12, 14, 16, 18, 20, 22, 24].map((size) => (
                        <SelectItem key={size} value={size.toString()} className="text-[11px] font-bold tracking-widest hover:bg-indigo-500/10 focus:bg-indigo-500/20 cursor-pointer">
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRun}
                  disabled={rloader}
                  size="sm"
                  className="h-9 px-5 text-[11px] font-bold uppercase tracking-widest bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all rounded-xl active:scale-95"
                >
                  {rloader ? (
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-transparent" />
                      <span>Running</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="h-3.5 w-3.5" />
                      <span>Run</span>
                    </div>
                  )}
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={sloader}
                  size="sm"
                  className="h-9 px-6 text-[11px] font-bold uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-500 border-none transition-all rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.4)] active:scale-95"
                >
                  {sloader ? (
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-transparent" />
                      <span>Submitting</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex-1 relative bg-[#121212]">
              <Editor
                height="100%"
                language={language.language}
                theme="vs-dark"
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

          <PanelResizeHandle className="h-1.5 flex items-center justify-center group bg-black/40 hover:bg-indigo-500/50 transition-all duration-300 relative z-50">
            <div className="w-8 h-1 rounded-full bg-white/10 group-hover:bg-white/40 transition-colors" />
          </PanelResizeHandle>

          <Panel defaultSize={35} minSize={20} className="flex flex-col bg-[#0a0a0a]">
            <div className="flex-none h-12 flex items-center justify-between px-6 border-b border-white/5 bg-neutral-900/40 backdrop-blur-md">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Terminal className="h-4 w-4" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">Execution Console</span>
                </div>

                {output?.status?.id !== 0 && (
                  <div className="flex items-center gap-4 border-l border-white/10 pl-6 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter">Status</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${output?.status?.id === 3 ? "text-emerald-500" :
                        output?.status?.id === 4 ? "text-rose-500" :
                          output?.status?.id === 5 ? "text-amber-500" :
                            "text-indigo-400"
                        }`}>
                        {output?.status?.description}
                      </span>
                    </div>

                    {output.time && (
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter">Time</span>
                        <span className="text-[10px] font-bold text-neutral-400 tabular-nums lowercase tracking-wider">{output.time}s</span>
                      </div>
                    )}

                    {output.memory && (
                      <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-tighter">Memory</span>
                        <span className="text-[10px] font-bold text-neutral-400 tabular-nums lowercase tracking-wider">{(output.memory / 1024).toFixed(1)}MB</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearOutput}
                  className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-600 hover:text-white hover:bg-white/5 transition-all"
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="flex-1 p-0 overflow-hidden flex bg-[#0d0d0d]">
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                  <div className="max-w-4xl">
                    {output.stderr ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-rose-500/80">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Runtime Error</span>
                        </div>
                        <pre className="text-[13px] font-mono text-rose-400/90 whitespace-pre-wrap break-all leading-relaxed p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                          {output.stderr}
                        </pre>
                      </div>
                    ) : output.compile_output ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-amber-500/80">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Compilation Error</span>
                        </div>
                        <pre className="text-[13px] font-mono text-amber-400/90 whitespace-pre-wrap break-all leading-relaxed p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                          {output.compile_output}
                        </pre>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Standard Output</span>
                        </div>
                        {output.stdout ? (
                          <pre className="text-[14px] font-mono text-neutral-300 whitespace-pre-wrap break-all leading-relaxed selection:bg-indigo-500/30">
                            {output.stdout}
                          </pre>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 opacity-20 pointer-events-none">
                            <Terminal className="h-10 w-10 mb-3 text-neutral-400" />
                            <p className="text-xs font-medium tracking-widest uppercase">Console Ready</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-[320px] flex flex-col border-l border-white/5 bg-black/20 backdrop-blur-sm">
                <div className="flex-none h-10 flex items-center px-5 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Test Input</span>
                </div>
                <div className="flex-1 relative group">
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="absolute inset-0 w-full h-full bg-transparent p-6 text-[13px] font-mono text-neutral-400 resize-none focus:outline-none placeholder:text-neutral-700/50 scrollbar-thin scrollbar-thumb-white/5 transition-all focus:bg-white/[0.01]"
                    placeholder="Enter process input..."
                    spellCheck={false}
                  />
                  <div className="absolute bottom-4 right-4 text-[9px] font-bold text-neutral-700 group-focus-within:text-indigo-500 transition-colors uppercase tracking-tighter">
                    Editable Stdin
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}