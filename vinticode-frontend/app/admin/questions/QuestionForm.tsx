"use client";

import { useState } from "react";
import { Plus, Trash2, EyeOff, Eye, GripVertical } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────
// Maps directly to the Questions Prisma model + test_cases JSON structure

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
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {children}
    </label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground mt-1">{children}</p>;
}

const textareaClass =
  "w-full bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-lg px-4 py-3 text-sm font-mono outline-none focus-visible:border-ring focus:ring-1 focus:ring-ring/50 transition-all duration-200 resize-y";

const inputClass =
  "w-full bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-lg px-4 py-3 text-sm outline-none focus-visible:border-ring focus:ring-1 focus:ring-ring/50 transition-all duration-200";

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
  // ── Schema fields (maps 1:1 to Prisma Questions model) ──
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [inputFormat, setInputFormat] = useState(
    initialData?.input_format ?? ""
  );
  const [outputFormat, setOutputFormat] = useState(
    initialData?.output_format ?? ""
  );
  const [sampleInput, setSampleInput] = useState(
    initialData?.sample_input ?? ""
  );
  const [sampleOutput, setSampleOutput] = useState(
    initialData?.sample_output ?? ""
  );
  const [difficulty, setDifficulty] = useState(
    initialData?.difficulty ?? "Easy"
  );

  // ── Test cases (stored in test_cases JSON field) ──
  const [testCases, setTestCases] = useState<TestCase[]>(
    initialData?.test_cases && initialData.test_cases.length > 0
      ? initialData.test_cases
      : [{ ...EMPTY_TC }]
  );

  // ── Local validation ──
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

  // ── Test case helpers ──

  const addTestCase = () =>
    setTestCases((prev) => [...prev, { ...EMPTY_TC }]);

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

  // ─── Render ─────────────────────────────────────────────────────────

  const hiddenCount = testCases.filter((tc) => tc.isHidden).length;
  const publicCount = testCases.length - hiddenCount;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Section 1: Basic Info ── */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="text-foreground font-semibold text-sm border-b border-border pb-3">
          Basic Information
        </h2>

        {/* title */}
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
          {fieldErrors.title && (
            <p className="text-destructive-fg text-xs mt-1">{fieldErrors.title}</p>
          )}
        </div>

        {/* difficulty */}
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

        {/* description */}
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
          {fieldErrors.description && (
            <p className="text-destructive-fg text-xs mt-1">
              {fieldErrors.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Section 2: I/O Specification ── */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h2 className="text-foreground font-semibold text-sm border-b border-border pb-3">
          Input / Output Specification
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* input_format */}
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
            {fieldErrors.input_format && (
              <p className="text-destructive-fg text-xs mt-1">
                {fieldErrors.input_format}
              </p>
            )}
          </div>

          {/* output_format */}
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
            {fieldErrors.output_format && (
              <p className="text-destructive-fg text-xs mt-1">
                {fieldErrors.output_format}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* sample_input */}
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
            {fieldErrors.sample_input && (
              <p className="text-destructive-fg text-xs mt-1">
                {fieldErrors.sample_input}
              </p>
            )}
          </div>

          {/* sample_output */}
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
            {fieldErrors.sample_output && (
              <p className="text-destructive-fg text-xs mt-1">
                {fieldErrors.sample_output}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: Test Cases ── */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-foreground font-semibold text-sm">Test Cases</h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              {publicCount} public · {hiddenCount} hidden
            </p>
          </div>
          <button
            type="button"
            onClick={addTestCase}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-accent text-foreground text-xs font-medium rounded-lg border border-border-strong transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Test Case
          </button>
        </div>

        <div className="space-y-4">
          {testCases.map((tc, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 space-y-4 transition-colors ${
                tc.isHidden
                  ? "border-warning/20 bg-warning-subtle"
                  : "border-border bg-background/60"
              }`}
            >
              {/* Test case header */}
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-foreground text-sm font-medium">
                    Test Case {i + 1}
                  </span>
                  {tc.isHidden ? (
                    <span className="flex items-center gap-1 text-xs text-warning-fg bg-warning-subtle border border-warning/20 px-2 py-0.5 rounded">
                      <EyeOff className="w-3 h-3" />
                      Hidden
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-success-fg bg-success-subtle border border-success/20 px-2 py-0.5 rounded">
                      <Eye className="w-3 h-3" />
                      Public
                    </span>
                  )}
                </div>
                {/* Toggle hidden */}
                <button
                  type="button"
                  onClick={() => updateTestCase(i, "isHidden", !tc.isHidden)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title={tc.isHidden ? "Make public" : "Make hidden"}
                >
                  {tc.isHidden ? "Make Public" : "Make Hidden"}
                </button>
                {/* Remove */}
                {testCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTestCase(i)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive-fg hover:bg-destructive-subtle transition-colors"
                    title="Remove test case"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Input / Output */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <p className="text-destructive-fg text-xs mt-1">
                      {fieldErrors[`tc_${i}_input`]}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Expected Output *</Label>
                  <textarea
                    rows={3}
                    value={tc.output}
                    onChange={(e) =>
                      updateTestCase(i, "output", e.target.value)
                    }
                    placeholder="expected stdout…"
                    className={textareaClass}
                  />
                  {fieldErrors[`tc_${i}_output`] && (
                    <p className="text-destructive-fg text-xs mt-1">
                      {fieldErrors[`tc_${i}_output`]}
                    </p>
                  )}
                </div>
              </div>

              {/* Explanation (optional) */}
              <div>
                <Label>Explanation (optional)</Label>
                <textarea
                  rows={2}
                  value={tc.explanation}
                  onChange={(e) =>
                    updateTestCase(i, "explanation", e.target.value)
                  }
                  placeholder="Why is this the expected output?"
                  className={textareaClass}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-warning-subtle border border-warning/20 rounded-lg px-4 py-3 text-xs text-warning-fg">
          <strong>Security:</strong> Hidden test cases are stored in the database
          but are never returned to users in any API response. Only admin
          endpoints expose the full <code>test_cases</code> JSON.
        </div>
      </div>

      {/* ── Global error / Submit ── */}
      {error && (
        <div className="bg-destructive-subtle border border-destructive/20 text-destructive-fg text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button
          type="submit"
          id="q-form-submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover
                     text-primary-foreground font-semibold rounded-lg text-sm transition-all duration-200
                     disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-border-strong border-t-white rounded-full animate-spin" />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
