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
      // Reset output before running
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
      setOutput(response.data.result);
    } catch (err: any) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        const errorData = err?.response?.data;
        // If the backend returns structured error data (stderr, compile_output, etc.)
        if (errorData?.result) {
          setOutput(errorData.result);
        } else if (errorData?.error) {
          // Fallback if just an error message string is returned
          setOutput(prev => ({ ...prev, stderr: errorData.error, status: { id: 1, description: "Error" } }));
        } else {
          toast.error("Code execution failed");
        }
      } else {
        toast.error("Please try running the code again");
      }
    } finally {
      setRloader(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSloader(true);
      setTestcaseStatus(testcaseStatus.map(() => "loading"));

      const resp = await api.post(
        `/questions/submitCode/${questionData.id}`,
        {
          code,
          questionId,
          language_id: language.id,
        }
      );

      setSubmissionOutput(resp.data.results);

      setTestcaseStatus(
        resp.data.results.map((r: string) =>
          r === "Accepted" ? "accepted" : "failed"
        )
      );

      toast.success("Code submitted successfully!");
    } catch (err: unknown) {
      console.error(err);

      if (axios.isAxiosError(err)) {
        const data = err.response?.data;

        if (data?.results) {
          const results = data.results;
          setSubmissionOutput(results);
          setTestcaseStatus(
            results.map((r: string) =>
              r === "Accepted" ? "accepted" : "failed"
            )
          );
        }

        // Also check for compilation/runtime errors in submission
        if (data?.error || data?.stderr || data?.compile_output) {
          setOutput({
            stdout: "",
            stderr: data?.stderr || data?.error || "",
            compile_output: data?.compile_output || "",
            message: data?.message || "",
            time: "",
            memory: 0,
            token: "",
            status: { id: 1, description: "Submission Error" }
          });
          // Open the output panel if it's not visible (optional, but good UX)
        }

        if (!data?.results && !data?.stderr && !data?.compile_output) {
          toast.error("Submission failed!");
        }
      } else {
        toast.error("Submission failed!");
      }
    } finally {
      setSloader(false);
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
    <PanelGroup direction="horizontal" className="h-screen w-full bg-neutral-950 text-white overflow-hidden">
      <Panel defaultSize={40} minSize={20}>
        <div className="flex flex-col h-full border-r border-neutral-800/50">
          {/* Header */}
          <div className="flex-none flex items-center gap-3 border-b border-neutral-800/50 bg-neutral-900/50 backdrop-blur-md px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-neutral-400 hover:text-white hover:bg-neutral-800"
              onClick={() => router.push("/dashboard/home")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {questionData.title && (
              <div className="flex items-center gap-3 overflow-hidden">
                <h1 className="truncate text-sm font-semibold text-white md:text-base">
                  {questionData.title}
                </h1>
                {questionData.done && (
                  <span className="flex-none inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Solved
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Problem Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
            {questionData.title ? (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div>
                  <span
                    className={`${questionData.difficulty === "Easy"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : questionData.difficulty === "Medium"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      } inline-flex rounded-full border px-2.5 py-1 text-xs font-medium`}
                  >
                    {questionData.difficulty}
                  </span>
                </div>

                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-neutral-300 leading-relaxed text-sm">
                    {questionData.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Input Format
                    </h3>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                      <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-mono">
                        {questionData.input_format}
                      </pre>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                      Output Format
                    </h3>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                      <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-mono">
                        {questionData.output_format}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Sample Input
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-neutral-400 hover:text-white"
                        onClick={() => {
                          navigator.clipboard.writeText(questionData.sample_input || "");
                          toast.success("Copied");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                      <pre className="text-xs text-neutral-300 font-mono">
                        {questionData.sample_input}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Sample Output
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-neutral-400 hover:text-white"
                        onClick={() => {
                          navigator.clipboard.writeText(questionData.sample_output || "");
                          toast.success("Copied");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                      <pre className="text-xs text-neutral-300 font-mono">
                        {questionData.sample_output}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Test Cases Status */}
                {questionData.test_cases.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-neutral-800/50">
                    <h3 className="text-sm font-medium text-white">Test Cases</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {questionData.test_cases.map((testCase, index) => {
                        const status = testcaseStatus[index];
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900/30 px-3 py-2"
                          >
                            <span className="text-xs text-neutral-400">Case {index + 1}</span>
                            {status === "pending" && (
                              <span className="text-[10px] text-neutral-600">Pending</span>
                            )}
                            {status === "loading" && (
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent"></span>
                            )}
                            {status === "accepted" && (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" /> Passed
                              </span>
                            )}
                            {status === "failed" && (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-rose-400">
                                <AlertCircle className="h-3 w-3" /> Failed
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
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4 bg-neutral-800" />
                <Skeleton className="h-4 w-1/4 bg-neutral-800" />
                <Skeleton className="h-32 w-full bg-neutral-800" />
              </div>
            )}
          </div>
        </div>
      </Panel>

      <PanelResizeHandle className="w-1 bg-neutral-900 hover:bg-blue-500/50 transition-colors" />

      <Panel defaultSize={60}>
        <PanelGroup direction="vertical">
          <Panel defaultSize={70} minSize={30}>
            <div className="flex flex-col h-full">
              {/* Editor Toolbar */}
              <div className="flex-none flex items-center justify-between border-b border-neutral-800/50 bg-neutral-900/50 px-4 py-2">
                <div className="flex items-center gap-3">
                  <Select
                    onValueChange={(value) => {
                      const selected = languages.find((lang) => lang.language === value);
                      if (selected) setLanguage(selected);
                    }}
                    value={language.language}
                  >
                    <SelectTrigger className="h-8 w-[140px] border-neutral-700 bg-neutral-800 text-xs text-white focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-800 bg-neutral-900 text-white">
                      {languages.map((lang) => (
                        <SelectItem key={lang.id} value={lang.language} className="text-xs">
                          {lang.language.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(value) => setFontSize(parseInt(value))}
                    value={fontSize.toString()}
                  >
                    <SelectTrigger className="h-8 w-[100px] border-neutral-700 bg-neutral-800 text-xs text-white focus:ring-0">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-800 bg-neutral-900 text-white">
                      {[12, 14, 16, 18, 20, 22, 24].map((size) => (
                        <SelectItem key={size} value={size.toString()} className="text-xs">
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
                    className="h-8 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 border border-blue-600/20"
                  >
                    {rloader ? (
                      <span className="animate-spin mr-2">⟳</span>
                    ) : (
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Run
                  </Button>

                  <Button
                    onClick={handleSubmit}
                    disabled={sloader}
                    size="sm"
                    className="h-8 bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
                  >
                    {sloader ? (
                      <span className="animate-spin mr-2">⟳</span>
                    ) : (
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Submit
                  </Button>
                </div>
              </div>

              {/* Editor */}
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
                    padding: { top: 16, bottom: 16 },
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  }}
                />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="h-1 bg-neutral-900 hover:bg-blue-500/50 transition-colors" />

          <Panel defaultSize={30} minSize={20}>
            <div className="flex flex-col h-full bg-[#1e1e1e] border-t border-neutral-800">
              <div className="flex-none flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
                <div className="flex items-center gap-2 text-neutral-400">
                  <Terminal className="h-4 w-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Console</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${output?.status?.description === "Accepted" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      output?.status?.id !== 3 && output?.status?.id !== 0 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        "bg-neutral-800 text-neutral-400 border-neutral-700"
                    }`}>
                    {output?.status?.description || "Ready"}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-auto font-mono text-sm">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-500 font-medium">Input</label>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="w-full h-20 bg-neutral-900/50 border border-neutral-800 rounded p-2 text-neutral-300 focus:outline-none focus:border-blue-500/50 text-xs resize-none"
                      placeholder="Enter custom input..."
                      spellCheck={false}
                    />
                  </div>

                  {(output.stdout || (!output.stderr && !output.compile_output && !output.message)) && (
                    <div className="space-y-2">
                      <label className="text-xs text-neutral-500 font-medium">Output</label>
                      <div className="bg-neutral-900/50 border border-neutral-800 rounded p-3 min-h-[3rem]">
                        <pre className="text-neutral-300 whitespace-pre-wrap break-all">
                          {output.stdout || <span className="text-neutral-600 italic">Run code to see output...</span>}
                        </pre>
                      </div>
                    </div>
                  )}

                  {output.stderr && (
                    <div className="space-y-2">
                      <label className="text-xs text-rose-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Standard Error
                      </label>
                      <div className="bg-rose-950/10 border border-rose-900/20 rounded p-3">
                        <pre className="text-rose-400 whitespace-pre-wrap break-all">{output.stderr}</pre>
                      </div>
                    </div>
                  )}

                  {output.compile_output && (
                    <div className="space-y-2">
                      <label className="text-xs text-amber-500 font-medium flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Compilation Error
                      </label>
                      <div className="bg-amber-950/10 border border-amber-900/20 rounded p-3">
                        <pre className="text-amber-400 whitespace-pre-wrap break-all">{output.compile_output}</pre>
                      </div>
                    </div>
                  )}

                  {output.message && (
                    <div className="space-y-2">
                      <label className="text-xs text-blue-500 font-medium">System Message</label>
                      <div className="bg-blue-950/10 border border-blue-900/20 rounded p-3">
                        <pre className="text-blue-400 whitespace-pre-wrap break-all">{output.message}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}