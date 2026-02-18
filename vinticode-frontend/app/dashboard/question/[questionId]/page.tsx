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

  return (
    <PanelGroup direction="horizontal" className="fixed inset-0 h-dvh w-screen bg-neutral-950 text-neutral-200 overflow-hidden z-50 font-sans selection:bg-blue-500/20">
      <Panel defaultSize={40} minSize={20} className="flex flex-col border-r border-white/5 bg-neutral-900/30">
        <div className="flex-none flex items-center gap-4 px-5 py-3 border-b border-white/5 bg-neutral-900/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            onClick={() => router.push("/dashboard/home")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {questionData.title && (
            <div className="flex flex-col gap-0.5 overflow-hidden">
              <div className="flex items-center gap-3">
                <h1 className="truncate text-sm font-medium text-white/90">
                  {questionData.title}
                </h1>
                {questionData.done && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-500">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Solved</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {questionData.title ? (
            <div className="space-y-8 max-w-3xl mx-auto pb-10">
              <div className="flex items-center gap-3">
                <span
                  className={`${questionData.difficulty === "Easy"
                    ? "text-emerald-400 bg-emerald-400/10 ring-emerald-400/20"
                    : questionData.difficulty === "Medium"
                      ? "text-amber-400 bg-amber-400/10 ring-amber-400/20"
                      : "text-rose-400 bg-rose-400/10 ring-rose-400/20"
                    } inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset`}
                >
                  {questionData.difficulty}
                </span>
              </div>

              <div className="prose prose-invert prose-sm max-w-none prose-p:text-neutral-300 prose-headings:text-neutral-100 prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/5 prose-pre:rounded-lg">
                <p>{questionData.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Input Format</h3>
                  <div className="p-4 rounded-lg bg-white/5 text-sm text-neutral-300 font-mono leading-relaxed border border-white/5">
                    {questionData.input_format}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Output Format</h3>
                  <div className="p-4 rounded-lg bg-white/5 text-sm text-neutral-300 font-mono leading-relaxed border border-white/5">
                    {questionData.output_format}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Sample Input</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs hover:bg-white/10 text-neutral-400 hover:text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(questionData.sample_input || "");
                        toast.success("Copied");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 text-sm text-neutral-300 font-mono border border-white/5">
                    <pre className="whitespace-pre-wrap">{questionData.sample_input}</pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Sample Output</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs hover:bg-white/10 text-neutral-400 hover:text-white"
                      onClick={() => {
                        navigator.clipboard.writeText(questionData.sample_output || "");
                        toast.success("Copied");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 text-sm text-neutral-300 font-mono border border-white/5">
                    <pre className="whitespace-pre-wrap">{questionData.sample_output}</pre>
                  </div>
                </div>
              </div>

              {questionData.test_cases.length > 0 && (
                <div className="pt-6 border-t border-white/5">
                  <h3 className="text-sm font-medium text-white mb-4">Test Cases</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {questionData.test_cases.map((testCase, index) => {
                      const status = testcaseStatus[index];
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 transition-colors"
                        >
                          <span className="text-xs font-medium text-neutral-400">Case {index + 1}</span>
                          {status === "pending" && (
                            <span className="text-[10px] text-neutral-600 font-medium tracking-wide">PENDING</span>
                          )}
                          {status === "loading" && (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent"></span>
                          )}
                          {status === "accepted" && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
                              <CheckCircle2 className="h-3.5 w-3.5" /> PASS
                            </span>
                          )}
                          {status === "failed" && (
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 uppercase tracking-wide">
                              <AlertCircle className="h-3.5 w-3.5" /> FAIL
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto mt-8">
              <Skeleton className="h-5 w-24 bg-white/5 rounded-full" />
              <Skeleton className="h-8 w-3/4 bg-white/5 rounded-lg" />
              <Skeleton className="h-40 w-full bg-white/5 rounded-lg" />
            </div>
          )}
        </div>
      </Panel>

      <PanelResizeHandle className="w-px bg-white/5 hover:bg-blue-500/50 transition-colors" />

      <Panel defaultSize={60}>
        <PanelGroup direction="vertical">
          <Panel defaultSize={70} minSize={30} className="flex flex-col bg-[#1e1e1e]">
            <div className="flex-none h-12 flex items-center justify-between px-4 border-b border-[#2b2b2b] bg-[#1e1e1e]">
              <div className="flex items-center gap-2">
                <Select
                  onValueChange={(value) => {
                    const selected = languages.find((lang) => lang.language === value);
                    if (selected) setLanguage(selected);
                  }}
                  value={language.language}
                >
                  <SelectTrigger className="h-7 w-[130px] border-none bg-white/5 hover:bg-white/10 text-xs text-neutral-300 focus:ring-0 rounded-md transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#2b2b2b] bg-[#1e1e1e] text-neutral-300">
                    {languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.language} className="text-xs hover:bg-white/5 cursor-pointer">
                        {lang.language.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  onValueChange={(value) => setFontSize(parseInt(value))}
                  value={fontSize.toString()}
                >
                  <SelectTrigger className="h-7 w-[70px] border-none bg-white/5 hover:bg-white/10 text-xs text-neutral-300 focus:ring-0 rounded-md transition-colors">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent className="border-[#2b2b2b] bg-[#1e1e1e] text-neutral-300">
                    {[12, 14, 16, 18, 20, 22, 24].map((size) => (
                      <SelectItem key={size} value={size.toString()} className="text-xs hover:bg-white/5 cursor-pointer">
                        {size}px
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRun}
                  disabled={rloader}
                  size="sm"
                  className="h-7 px-3 text-xs bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border-none transition-all rounded-md font-medium"
                >
                  {rloader ? (
                    <span className="animate-spin mr-1.5">⟳</span>
                  ) : (
                    <Play className="mr-1.5 h-3 w-3" />
                  )}
                  Run
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={sloader}
                  size="sm"
                  className="h-7 px-3 text-xs bg-emerald-500 text-white hover:bg-emerald-400 border-none transition-all rounded-md font-medium shadow-none hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  {sloader ? (
                    <span className="animate-spin mr-1.5">⟳</span>
                  ) : (
                    <Send className="mr-1.5 h-3 w-3" />
                  )}
                  Submit
                </Button>
              </div>
            </div>

            <div className="flex-1 relative">
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
                  padding: { top: 20, bottom: 20 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                }}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="h-px bg-[#2b2b2b] hover:bg-blue-500/50 transition-colors" />

          <Panel defaultSize={30} minSize={20} className="flex flex-col bg-[#1e1e1e]">
            <div className="flex-none h-9 flex items-center justify-between px-4 border-b border-[#2b2b2b] bg-[#1e1e1e]">
              <div className="flex items-center gap-2 text-neutral-500">
                <Terminal className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wider">Console</span>
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${output?.status?.description === "Accepted" ? "text-emerald-500" :
                output?.status?.id !== 3 && output?.status?.id !== 0 ? "text-rose-500" :
                  "text-neutral-500"
                }`}>
                {output?.status?.description || "Ready"}
              </span>
            </div>

            <div className="flex-1 p-0 overflow-hidden flex">
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-none px-4 py-2 border-b border-[#2b2b2b]/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Standard Output</span>
                </div>
                <div className="flex-1 overflow-auto p-4 pt-2">
                  <pre className="text-xs font-mono text-neutral-300 whitespace-pre-wrap break-all leading-relaxed">
                    {output.stderr ? (
                      <span className="text-rose-400">{output.stderr}</span>
                    ) : output.compile_output ? (
                      <span className="text-amber-400">{output.compile_output}</span>
                    ) : output.stdout ? (
                      output.stdout
                    ) : (
                      <span className="text-neutral-700 italic opacity-50">Run code to see output...</span>
                    )}
                  </pre>
                </div>
              </div>

              <div className="w-1/3 flex flex-col border-l border-[#2b2b2b] min-w-[200px]">
                <div className="flex-none px-4 py-2 border-b border-[#2b2b2b]/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Input</span>
                </div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="flex-1 w-full bg-transparent p-4 pt-2 text-xs font-mono text-neutral-400 resize-none focus:outline-none placeholder:text-neutral-700/50"
                  placeholder="Enter custom input..."
                  spellCheck={false}
                />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}