"use client";

import Editor, { OnChange } from "@monaco-editor/react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Lock, NotebookPen, Sparkles } from "lucide-react";
import { PlayButton, A } from "@/components/playground";
import type { ApproachReviewResult, ReviewState } from "@/lib/scratchpadApi";
import { ApproachReview, ReviewError } from "./ApproachReview";

function diffColor(difficulty: string) {
  switch (difficulty.toLowerCase()) {
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

const PLACEHOLDER =
  "Write your approach, pseudocode, edge cases, or notes here...";

export interface ScratchPadProps {
  title: string;
  difficulty: string;
  notes: string;
  onNotesChange: (value: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack?: () => void;
  loading?: boolean;
  // Review props
  onReview: () => void;
  reviewState: ReviewState;
  reviewResult: ApproachReviewResult | null;
  reviewError: string;
  onDismissReview: () => void;
}

function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export default function ScratchPad({
  title,
  difficulty,
  notes,
  onNotesChange,
  onContinue,
  onSkip,
  onBack,
  loading = false,
  onReview,
  reviewState,
  reviewResult,
  reviewError,
  onDismissReview,
}: ScratchPadProps) {
  const handleChange: OnChange = (value) => {
    onNotesChange(value ?? "");
  };

  const isReviewing = reviewState === "loading";
  const showResult = reviewState === "result" && reviewResult !== null;
  const showError = reviewState === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="dark h-dvh w-full bg-[#0a0a0d] font-sans text-white"
    >
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-5 py-8 sm:px-8 sm:py-12">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-lg border-[3px] border-black bg-[#141419] px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/80 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:text-white"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2.5} />
            Questions
          </button>
        )}

        <header className="flex-none space-y-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-6 w-20 animate-pulse rounded-lg bg-white/10" />
              <div className="h-9 w-3/4 animate-pulse rounded-xl bg-white/10" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex items-center rounded-md border-2 border-black px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-black"
                  style={{ background: diffColor(difficulty) }}
                >
                  {difficulty}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/40">
                  <Lock className="size-3" />
                  Private
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
            </>
          )}

          <p className="text-sm font-medium leading-relaxed text-white/55">
            Plan your solution before coding. This scratch pad is private and
            optional.
          </p>
        </header>

        <div className="mt-8 flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex min-h-[35vh] flex-1 flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-[#141419]">
            <div className="flex flex-none items-center gap-2 border-b-[3px] border-black bg-[#0d0d11] px-5 py-3">
              <NotebookPen className="size-3.5 text-[var(--pg-lime)]" strokeWidth={2.5} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                Scratch Pad
              </span>
            </div>

            <div className="relative flex-1">
              <Editor
                height="100%"
                language="markdown"
                theme="vs-dark"
                value={notes}
                onChange={handleChange}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 20, bottom: 20 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  lineNumbers: "off",
                  renderLineHighlight: "none",
                  wordWrap: "on",
                  folding: false,
                  glyphMargin: false,
                  lineDecorationsWidth: 0,
                  overviewRulerLanes: 0,
                  scrollbar: {
                    vertical: "visible",
                    horizontal: "hidden",
                    useShadows: false,
                    verticalScrollbarSize: 10,
                  },
                }}
              />

              {notes.length === 0 && (
                <div className="pointer-events-none absolute left-[26px] top-[20px] select-none font-mono text-[14px] leading-[21px] text-white/30">
                  {PLACEHOLDER}
                </div>
              )}
            </div>

            <div className="flex flex-none items-center justify-end border-t-[3px] border-black bg-[#0d0d11] px-5 py-2">
              <span className="text-[10px] font-bold tabular-nums uppercase tracking-widest text-white/40">
                {notes.length} {notes.length === 1 ? "character" : "characters"}
              </span>
            </div>
          </div>

          {(showResult || showError) && (
            <div className="flex-none">
              {showResult && (
                <ApproachReview
                  result={reviewResult!}
                  onContinue={onContinue}
                  onEditApproach={onDismissReview}
                />
              )}
              {showError && (
                <ReviewError
                  message={reviewError}
                  onRetry={onReview}
                  onContinue={onContinue}
                />
              )}
            </div>
          )}

          {!showResult && !showError && (
            <div className="flex flex-none flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <PlayButton
                onClick={onSkip}
                fill="#0d0d11"
                shadow={A.amber}
                text="#ffffff"
                className="!px-5 !py-2.5 text-[11px] uppercase tracking-widest"
              >
                Skip Scratch Pad
              </PlayButton>

              <PlayButton
                onClick={onReview}
                disabled={isReviewing}
                aria-busy={isReviewing}
                fill="#0d0d11"
                shadow={A.cyan}
                text="#ffffff"
                className="!px-5 !py-2.5 text-[11px] uppercase tracking-widest"
              >
                {isReviewing ? (
                  <>
                    <Spinner />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" strokeWidth={2.5} />
                    Review My Approach
                  </>
                )}
              </PlayButton>

              <PlayButton
                onClick={onContinue}
                fill={A.lime}
                shadow={A.coral}
                className="!px-6 !py-2.5 text-[11px] uppercase tracking-widest"
              >
                Continue to Coding
                <ArrowRight className="size-3.5" strokeWidth={3} />
              </PlayButton>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
