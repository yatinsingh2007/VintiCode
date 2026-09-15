"use client";

import { useState } from "react";
import { Plus, Trash2, EyeOff, Eye, GripVertical } from "lucide-react";
import { PlayButton, A } from "@/components/playground";

// ─── Types ─────────────────────────────────────────────────────────────
export interface TestCase {
  input: string;
  output: string;
  isHidden: boolean;
  explanation: string;
}

export interface QuestionFormData {
  title: string;
  description: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  test_cases: TestCase[];
}

interface Props {
  initialData?: Partial<QuestionFormData>;
  onSubmit: (data: QuestionFormData) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  error?: string;
}

// ─── Field helpers ──────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/70">
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs font-medium text-white/40">{children}</p>;
}

const textareaClass =
  "w-full rounded-xl border-[3px] border-black bg-[#0d0d11] px-4 py-3 text-sm font-mono text-white placeholder:text-white/30 outline-none transition-shadow focus:shadow-[4px_4px_0_0_var(--pg-cyan)] resize-y";

const inputClass =
  "w-full rounded-xl border-[3px] border-black bg-[#0d0d11] px-4 py-3 text-sm font-medium text-white placeholder:text-white/30 outline-none transition-shadow focus:shadow-[4px_4px_0_0_var(--pg-cyan)]";

const errText = "mt-1 text-xs font-semibold text-[var(--pg-coral)]";
const sectionClass = "rounded-2xl border-[3px] border-black bg-[#141419] p-6 space-y-5";
const sectionHead = "border-b-[3px] border-black pb-3 text-sm font-extrabold text-white";

// ─── Main Component ─────────────────────────────────────────────────────

const EMPTY_TC: TestCase = {
  input: "",
  output: "",
  isHidden: false,
  explanation: "",
};

export default function QuestionForm({
  initialData,
  onSubmit,
  submitLabel = "Save Question",
  loading = false,
  error,
}: Props) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [inputFormat, setInputFormat] = useState(initialData?.input_format ?? "");
  const [outputFormat, setOutputFormat] = useState(initialData?.output_format ?? "");
  const [sampleInput, setSampleInput] = useState(initialData?.sample_input ?? "");
  const [sampleOutput, setSampleOutput] = useState(initialData?.sample_output ?? "");
  const [difficulty, setDifficulty] = useState(initialData?.difficulty ?? "Easy");

  const [testCases, setTestCases] = useState<TestCase[]>(
    initialData?.test_cases && initialData.test_cases.length > 0
      ? initialData.test_cases
      : [{ ...EMPTY_TC }]
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required.";
    if (!description.trim()) errs.description = "Description is required.";
    if (!inputFormat.trim()) errs.input_format = "Input format is required.";
    if (!outputFormat.trim()) errs.output_format = "Output format is required.";
    if (!sampleInput.trim()) errs.sample_input = "Sample input is required.";
    if (!sampleOutput.trim()) errs.sample_output = "Sample output is required.";

    testCases.forEach((tc, i) => {
      if (!tc.input.trim())
        errs[`tc_${i}_input`] = `Test case ${i + 1}: input is required.`;
      if (!tc.output.trim())
        errs[`tc_${i}_output`] = `Test case ${i + 1}: expected output is required.`;
    });

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      input_format: inputFormat.trim(),
      output_format: outputFormat.trim(),
      sample_input: sampleInput.trim(),
      sample_output: sampleOutput.trim(),
      difficulty,
      test_cases: testCases,
    });
  };

  const addTestCase = () => setTestCases((prev) => [...prev, { ...EMPTY_TC }]);

  const removeTestCase = (i: number) =>
    setTestCases((prev) => prev.filter((_, idx) => idx !== i));

  const updateTestCase = (
    i: number,
    field: keyof TestCase,
    value: string | boolean
  ) =>
    setTestCases((prev) =>
      prev.map((tc, idx) => (idx === i ? { ...tc, [field]: value } : tc))
    );

  const hiddenCount = testCases.filter((tc) => tc.isHidden).length;
  const publicCount = testCases.length - hiddenCount;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Section 1: Basic Info ── */}
      <div className={sectionClass}>
        <h2 className={sectionHead}>Basic Information</h2>

        <div>
          <Label>Title *</Label>
          <input
            id="q-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Two Sum"
            className={inputClass}
          />
          {fieldErrors.title && <p className={errText}>{fieldErrors.title}</p>}
        </div>

        <div>
          <Label>Difficulty *</Label>
          <select
            id="q-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className={inputClass + " cursor-pointer"}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        <div>
          <Label>Problem Description *</Label>
          <textarea
            id="q-description"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem statement clearly…"
            className={textareaClass}
          />
          {fieldErrors.description && <p className={errText}>{fieldErrors.description}</p>}
        </div>
      </div>

      {/* ── Section 2: I/O Specification ── */}
      <div className={sectionClass}>
        <h2 className={sectionHead}>Input / Output Specification</h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label>Input Format *</Label>
            <textarea
              id="q-input-format"
              rows={4}
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value)}
              placeholder="Describe the structure of the input…"
              className={textareaClass}
            />
            {fieldErrors.input_format && <p className={errText}>{fieldErrors.input_format}</p>}
          </div>

          <div>
            <Label>Output Format *</Label>
            <textarea
              id="q-output-format"
              rows={4}
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              placeholder="Describe the expected output…"
              className={textareaClass}
            />
            {fieldErrors.output_format && <p className={errText}>{fieldErrors.output_format}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label>Sample Input *</Label>
            <textarea
              id="q-sample-input"
              rows={4}
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              placeholder="5&#10;1 2 3 4 5"
              className={textareaClass}
            />
            <FieldHint>Shown to users on the problem page.</FieldHint>
            {fieldErrors.sample_input && <p className={errText}>{fieldErrors.sample_input}</p>}
          </div>

          <div>
            <Label>Sample Output *</Label>
            <textarea
              id="q-sample-output"
              rows={4}
              value={sampleOutput}
              onChange={(e) => setSampleOutput(e.target.value)}
              placeholder="15"
              className={textareaClass}
            />
            <FieldHint>Shown to users on the problem page.</FieldHint>
            {fieldErrors.sample_output && <p className={errText}>{fieldErrors.sample_output}</p>}
          </div>
        </div>
      </div>

      {/* ── Section 3: Test Cases ── */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between border-b-[3px] border-black pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-white">Test Cases</h2>
            <p className="mt-0.5 text-xs font-medium text-white/50">
              {publicCount} public · {hiddenCount} hidden
            </p>
          </div>
          <button
            type="button"
            onClick={addTestCase}
            className="inline-flex items-center gap-1.5 rounded-lg border-[3px] border-black bg-[#0d0d11] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[var(--pg-lime)] hover:text-black"
          >
            <Plus className="size-3.5" strokeWidth={3} />
            Add Test Case
          </button>
        </div>

        <div className="space-y-4">
          {testCases.map((tc, i) => (
            <div
              key={i}
              className="space-y-4 rounded-xl border-[3px] border-black bg-[#0d0d11] p-4"
              style={tc.isHidden ? { boxShadow: "5px 5px 0 0 var(--pg-amber)" } : undefined}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="size-4 shrink-0 text-white/40" />
                <div className="flex flex-1 items-center gap-2">
                  <span className="text-sm font-bold text-white">Test Case {i + 1}</span>
                  {tc.isHidden ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-md border-2 border-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-black"
                      style={{ background: A.amber }}
                    >
                      <EyeOff className="size-3" strokeWidth={3} />
                      Hidden
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 rounded-md border-2 border-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-black"
                      style={{ background: A.lime }}
                    >
                      <Eye className="size-3" strokeWidth={3} />
                      Public
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => updateTestCase(i, "isHidden", !tc.isHidden)}
                  className="text-xs font-bold text-white/60 transition-colors hover:text-white"
                  title={tc.isHidden ? "Make public" : "Make hidden"}
                >
                  {tc.isHidden ? "Make Public" : "Make Hidden"}
                </button>
                {testCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestCase(i)}
                    className="rounded border-2 border-transparent p-1 text-white/60 transition-colors hover:border-black hover:bg-[var(--pg-coral)] hover:text-black"
                    title="Remove test case"
                  >
                    <Trash2 className="size-3.5" strokeWidth={2.5} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Input *</Label>
                  <textarea
                    rows={3}
                    value={tc.input}
                    onChange={(e) => updateTestCase(i, "input", e.target.value)}
                    placeholder="stdin value…"
                    className={textareaClass}
                  />
                  {fieldErrors[`tc_${i}_input`] && (
                    <p className={errText}>{fieldErrors[`tc_${i}_input`]}</p>
                  )}
                </div>
                <div>
                  <Label>Expected Output *</Label>
                  <textarea
                    rows={3}
                    value={tc.output}
                    onChange={(e) => updateTestCase(i, "output", e.target.value)}
                    placeholder="expected stdout…"
                    className={textareaClass}
                  />
                  {fieldErrors[`tc_${i}_output`] && (
                    <p className={errText}>{fieldErrors[`tc_${i}_output`]}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Explanation (optional)</Label>
                <textarea
                  rows={2}
                  value={tc.explanation}
                  onChange={(e) => updateTestCase(i, "explanation", e.target.value)}
                  placeholder="Why is this the expected output?"
                  className={textareaClass}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-xl border-[3px] border-black bg-[#0d0d11] px-4 py-3 text-xs font-medium text-white/70"
          style={{ boxShadow: "5px 5px 0 0 var(--pg-amber)" }}
        >
          <strong className="text-[var(--pg-amber)]">Security:</strong> Hidden test cases are
          stored in the database but are never returned to users in any API response. Only
          admin endpoints expose the full <code>test_cases</code> JSON.
        </div>
      </div>

      {/* ── Global error / Submit ── */}
      {error && (
        <div
          className="rounded-xl border-[3px] border-black bg-[#141419] px-4 py-3 text-sm font-semibold text-[var(--pg-coral)]"
          style={{ boxShadow: "5px 5px 0 0 var(--pg-coral)" }}
        >
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <PlayButton type="submit" id="q-form-submit" disabled={loading} aria-busy={loading} fill={A.lime} shadow={A.coral}>
          {loading && (
            <div className="size-4 animate-spin rounded-full border-2 border-black/40 border-t-transparent" />
          )}
          {submitLabel}
        </PlayButton>
      </div>
    </form>
  );
}
