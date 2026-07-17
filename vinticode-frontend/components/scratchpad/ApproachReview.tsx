"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  PenLine,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApproachReviewResult } from "@/lib/scratchpadApi";

interface ApproachReviewProps {
  result: ApproachReviewResult;
  onContinue: () => void;
  onEditApproach: () => void;
}

interface ReviewErrorProps {
  message: string;
  onRetry: () => void;
  onContinue: () => void;
}

function SuggestionItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
      <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
      {text}
    </li>
  );
}

export function ApproachReview({
  result,
  onContinue,
  onEditApproach,
}: ApproachReviewProps) {
  const isReady = result.status === "READY";

  const statusConfig = isReady
    ? {
        icon: CheckCircle2,
        label: "Ready to Start Coding",
        badgeClass:
          "text-success-fg bg-success-subtle ring-success/20",
        iconClass: "text-success-fg",
      }
    : {
        icon: Lightbulb,
        label: "Consider Thinking a Bit More",
        badgeClass:
          "text-warning-fg bg-warning-subtle ring-warning/20",
        iconClass: "text-warning-fg",
      };

  const Icon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-5 py-3">
        <Icon className={`h-3.5 w-3.5 ${statusConfig.iconClass}`} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Approach Review
        </span>
      </div>

      <div className="space-y-4 p-5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ${statusConfig.badgeClass}`}
        >
          <Icon className="h-3 w-3" />
          {statusConfig.label}
        </span>

        <p className="text-sm leading-relaxed text-foreground">{result.summary}</p>

        {result.suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Things to consider
            </p>
            <ul className="space-y-2">
              {result.suggestions.map((s, i) => (
                <SuggestionItem key={i} text={s} />
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="ghost"
          onClick={onEditApproach}
          className="h-10 rounded-xl px-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
        >
          <PenLine className="h-3.5 w-3.5" />
          Edit Approach
        </Button>

        <Button
          onClick={onContinue}
          className={`h-10 gap-2 rounded-xl border-none px-6 text-[11px] font-bold uppercase tracking-widest text-foreground shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all active:scale-95 ${
            isReady
              ? "bg-primary hover:bg-primary"
              : "bg-primary/70 hover:bg-primary/80"
          }`}
        >
          Continue to Coding
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

export function ReviewError({ message, onRetry, onContinue }: ReviewErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-destructive/20 bg-destructive-subtle/30 backdrop-blur-sm"
    >
      <div className="flex items-center gap-2 border-b border-destructive/10 bg-muted/20 px-5 py-3">
        <AlertCircle className="h-3.5 w-3.5 text-destructive-fg" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Review Failed
        </span>
      </div>

      <div className="p-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {message || "Something went wrong while analyzing your approach."}
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-destructive/10 bg-muted/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
        <Button
          variant="ghost"
          onClick={onContinue}
          className="h-10 rounded-xl px-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
        >
          Continue Anyway
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>

        <Button
          onClick={onRetry}
          className="h-10 gap-2 rounded-xl border-none bg-primary px-6 text-[11px] font-bold uppercase tracking-widest text-foreground shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all hover:bg-primary active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Try Again
        </Button>
      </div>
    </motion.div>
  );
}
