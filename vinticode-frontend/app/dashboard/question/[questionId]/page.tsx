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
import { ArrowLeft, CheckCircle2 } from "lucide-react";

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
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        toast.error(err?.response?.data?.error || "Code execution failed");
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

      if (axios.isAxiosError(err) && err.response?.data?.results) {
        const results = err.response.data.results;

        setSubmissionOutput(results);

        setTestcaseStatus(
          results.map((r: string) =>
            r === "Accepted" ? "accepted" : "failed"
          )
        );
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
    <PanelGroup direction="horizontal">
      <Panel defaultSize={40}>
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-800/50 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 backdrop-blur-md px-4 py-3 shadow-lg">
          <Button
            variant="ghost"
            className="h-9 gap-2 rounded-lg border border-neutral-700/50 bg-neutral-900/50 px-3 text-neutral-200 hover:bg-neutral-800 hover:border-blue-500/30 transition-all"
            onClick={() => router.push("/dashboard/home")}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          {questionData.title && (
            <div className="ml-1 flex items-center gap-2">
              <h1 className="text-base font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent md:text-lg">
                {questionData.title}
              </h1>
              {questionData.done && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Solved
                </span>
              )}
            </div>
          )}
        </div>

        <div className="p-6 text-white overflow-y-auto h-[calc(100vh-48px)] bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
          {questionData.title ? (
            <>
              <span
                className={`${questionData.difficulty === "Easy"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10"
                    : questionData.difficulty === "Medium"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/10"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-500/10"
                  } inline-flex rounded-full px-3 py-1.5 text-xs font-medium`}
              >
                {questionData.difficulty}
              </span>

              <div className="mt-4 rounded-xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 backdrop-blur-sm p-5 shadow-lg">
                <h3 className="text-base font-semibold text-white mb-2">Description</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {questionData.description}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900/50 to-neutral-900/30 backdrop-blur-sm p-4 shadow-md">
                  <h3 className="text-sm font-semibold text-blue-400 mb-2">Input Format</h3>
                  <pre className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {questionData.input_format}
                  </pre>
                </div>
                <div className="rounded-xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900/50 to-neutral-900/30 backdrop-blur-sm p-4 shadow-md">
                  <h3 className="text-sm font-semibold text-cyan-400 mb-2">Output Format</h3>
                  <pre className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {questionData.output_format}
                  </pre>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 backdrop-blur-sm p-4 shadow-md">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Sample Input</h3>
                    <Button
                      variant="ghost"
                      className="h-7 rounded-lg border border-neutral-700/50 bg-neutral-800/50 px-3 text-xs text-neutral-200 hover:bg-neutral-700 hover:border-blue-500/30 transition-all"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          questionData.sample_input || ""
                        );
                        toast.success("Sample input copied");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-neutral-950/50 border border-neutral-800/30 p-3 text-xs text-neutral-200 rounded-lg">
                    {questionData.sample_input}
                  </pre>
                </div>

                <div className="rounded-xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 backdrop-blur-sm p-4 shadow-md">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">
                      Sample Output
                    </h3>
                    <Button
                      variant="ghost"
                      className="h-7 rounded-lg border border-neutral-700/50 bg-neutral-800/50 px-3 text-xs text-neutral-200 hover:bg-neutral-700 hover:border-blue-500/30 transition-all"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          questionData.sample_output || ""
                        );
                        toast.success("Sample output copied");
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-neutral-950/50 border border-neutral-800/30 p-3 text-xs text-neutral-200 rounded-lg">
                    {questionData.sample_output}
                  </pre>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 backdrop-blur-sm p-5 shadow-lg">
                <h3 className="text-base font-semibold text-white mb-4">
                  Test Cases
                </h3>

                <div className="space-y-2.5">
                  {questionData.test_cases.map((testCase, index) => {
                    const status = testcaseStatus[index];

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between border border-neutral-700/50 rounded-lg p-3.5 bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-neutral-200">
                            Test Case {index + 1}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Input:{" "}
                            {testCase.input.length > 15
                              ? testCase.input.slice(0, 15) + "..."
                              : testCase.input}
                          </p>
                        </div>

                        {status === "pending" && (
                          <span className="text-neutral-500 text-xs px-2.5 py-1 bg-neutral-700/30 rounded-full">Pending</span>
                        )}

                        {status === "loading" && (
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400/70 border-t-transparent"></span>
                        )}

                        {status === "accepted" && (
                          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                          </span>
                        )}

                        {status === "failed" && (
                          <span className="flex items-center gap-1.5 text-rose-400 text-xs font-medium bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                            ✗ Failed
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4 bg-gray-700 rounded-md" />
              <Skeleton className="h-5 w-24 bg-gray-700 rounded-md" />
              <Skeleton className="h-24 w-full bg-gray-700 rounded-md" />
              <Skeleton className="h-6 w-40 bg-gray-700 rounded-md" />
              <Skeleton className="h-12 w-full bg-gray-700 rounded-md" />
            </div>
          )}
        </div>
      </Panel>

      <PanelResizeHandle className="w-1 bg-gray-700" />

      <Panel defaultSize={60}>
        <PanelGroup direction="vertical">
          <Panel defaultSize={70}>
            <div className="flex flex-col h-full bg-gradient-to-br from-neutral-950 to-neutral-900">
              <div className="flex items-center justify-between px-4 py-3 bg-neutral-900/50 backdrop-blur-md border-b border-neutral-800/50">
                <div className="flex items-center gap-3">
                  <Select
                    onValueChange={(value) => {
                      const selected = languages.find(
                        (lang) => lang.language === value
                      );
                      if (selected) setLanguage(selected);
                    }}
                    value={language.language}
                  >
                    <SelectTrigger className="w-[180px] bg-neutral-900/50 border-neutral-700/50 text-white rounded-lg hover:border-blue-500/30 transition-all">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 text-white border-neutral-800 rounded-lg">
                      {languages.map((lang) => (
                        <SelectItem key={lang.id} value={lang.language}>
                          {lang.language.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    onValueChange={(value) => setFontSize(parseInt(value))}
                    value={fontSize.toString()}
                  >
                    <SelectTrigger className="w-[120px] bg-neutral-900/50 border-neutral-700/50 text-white rounded-lg hover:border-blue-500/30 transition-all">
                      <SelectValue placeholder="Font Size" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 text-white border-neutral-800 rounded-lg">
                      {[12, 14, 16, 18, 20, 22, 24].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleRun}
                    disabled={rloader}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-blue-600/20 transition-all"
                  >
                    {rloader ? "Running..." : "Run"}
                  </Button>

                  <Button
                    onClick={handleSubmit}
                    disabled={sloader}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    {sloader ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>

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
                }}
              />
            </div>
          </Panel>

          <PanelResizeHandle className="h-1 bg-gray-700" />

          <Panel defaultSize={30}>
            <div className="h-full bg-gradient-to-br from-neutral-950 to-neutral-900 text-white border-t border-neutral-800/50 p-4 overflow-auto">

              <div className="mb-4">
                <h3 className="text-neutral-300 font-medium mb-2 text-sm">Custom Input</h3>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="w-full h-24 bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-3 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  placeholder="Enter custom input here..."
                ></textarea>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-neutral-300 font-medium text-sm">Output</h3>
                <span className="text-[10px] bg-neutral-800/50 border border-neutral-700/30 px-2.5 py-1 rounded-full text-neutral-400">
                  {output?.status?.description || "Idle"}
                </span>
              </div>

              <pre className="text-emerald-400 whitespace-pre-wrap bg-neutral-900/30 border border-neutral-800/30 rounded-lg p-3 text-sm">
                {output.stdout || "Output will appear here..."}
              </pre>

              {output.stderr && (
                <div className="mt-3 p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg">
                  <h4 className="text-rose-400 font-medium text-sm mb-2">Error Output</h4>
                  <pre className="text-rose-300 text-xs whitespace-pre-wrap">{output.stderr}</pre>
                </div>
              )}

              {output.compile_output && (
                <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                  <h4 className="text-amber-400 font-medium text-sm mb-2">Compile Output</h4>
                  <pre className="text-amber-300 text-xs whitespace-pre-wrap">{output.compile_output}</pre>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}