"use client";

import { useContext } from "react";
import Editor, { OnChange } from "@monaco-editor/react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Lock, NotebookPen } from "lucide-react";
import { ThemeContext } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const getDifficultyBadge = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "text-success-fg bg-success-subtle ring-success/20";
    case "medium":
      return "text-warning-fg bg-warning-subtle ring-warning/20";
    case "hard":
      return "text-destructive-fg bg-destructive-subtle ring-destructive/20";
    default:
      return "text-muted-foreground bg-muted/30 ring-border";
  }
};

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
}: ScratchPadProps) {
  const { theme } = useContext(ThemeContext);

  const handleChange: OnChange = (value) => {
    onNotesChange(value ?? "");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-dvh w-full bg-background text-foreground font-sans"
    >
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-5 py-8 sm:px-8 sm:py-12">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-6 h-8 w-fit gap-2 px-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Questions
          </Button>
        )}

        <header className="flex-none space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-20 rounded-full bg-muted" />
              <Skeleton className="h-9 w-3/4 rounded-xl bg-muted" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ${getDifficultyBadge(
                    difficulty
                  )}`}
                >
                  {difficulty}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Private
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
            </>
          )}

          <p className="text-sm leading-relaxed text-muted-foreground">
            Plan your solution before coding. This scratch pad is private and
            optional.
          </p>
        </header>

        <div className="mt-8 flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-[45vh] flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm transition-colors focus-within:border-primary/40">
            <div className="flex flex-none items-center gap-2 border-b border-border bg-muted/20 px-5 py-3">
              <NotebookPen className="h-3.5 w-3.5 text-primary-fg" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Scratch Pad
              </span>
            </div>

            <div className="relative flex-1">
              <Editor
                height="100%"
                language="markdown"
                theme={theme === "dark" ? "vs-dark" : "light"}
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
                <div className="pointer-events-none absolute left-[26px] top-[20px] select-none font-mono text-[14px] leading-[21px] text-muted-foreground/50">
                  {PLACEHOLDER}
                </div>
              )}
            </div>

            <div className="flex flex-none items-center justify-end border-t border-border bg-muted/10 px-5 py-2">
              <span className="text-[10px] font-medium tabular-nums uppercase tracking-widest text-muted-foreground">
                {notes.length} {notes.length === 1 ? "character" : "characters"}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-none flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="h-11 rounded-xl px-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
            >
              Skip Scratch Pad
            </Button>

            <Button
              onClick={onContinue}
              className="h-11 gap-2 rounded-xl border-none bg-primary px-6 text-[11px] font-bold uppercase tracking-widest text-foreground shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all hover:bg-primary active:scale-95"
            >
              Continue to Coding
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
