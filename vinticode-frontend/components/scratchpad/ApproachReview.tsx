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
import { PlayButton, A } from "@/components/playground";
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
    <li className="flex items-start gap-2.5 text-sm font-medium text-pg-text-muted">
      <span
        className="mt-[6px] size-2 shrink-0 rounded-full border border-pg-border"
        style={{ background: A.cyan }}
      />
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
        color: A.lime,
      }
    : {
        icon: Lightbulb,
        label: "Consider Thinking a Bit More",
        color: A.amber,
      };

  const Icon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border-[3px] border-pg-border bg-pg-surface"
      style={{ boxShadow: `8px 8px 0 0 ${statusConfig.color}` }}
    >
      <div className="flex items-center gap-2 border-b-[3px] border-pg-border bg-pg-surface px-5 py-3">
        <Icon className="size-3.5" strokeWidth={2.5} style={{ color: statusConfig.color }} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-pg-text-muted">
          Approach Review
        </span>
      </div>

      <div className="space-y-4 p-5">
        <span
          className="inline-flex items-center gap-1.5 rounded-md border-2 border-pg-border px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black"
          style={{ background: statusConfig.color }}
        >
          <Icon className="size-3" strokeWidth={3} />
          {statusConfig.label}
        </span>

        <p className="text-sm font-medium leading-relaxed text-pg-text">{result.summary}</p>

        {result.suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-pg-text-muted">
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

      <div className="flex flex-col-reverse gap-3 border-t-[3px] border-pg-border bg-pg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
        <PlayButton
          onClick={onEditApproach}
          fill="#141419"
          shadow={A.cyan}
          text="#ffffff"
          className="!px-5 !py-2.5 text-[11px] uppercase tracking-widest"
        >
          <PenLine className="size-3.5" strokeWidth={2.5} />
          Edit Approach
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
    </motion.div>
  );
}

export function ReviewError({ message, onRetry, onContinue }: ReviewErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border-[3px] border-pg-border bg-pg-surface"
      style={{ boxShadow: `8px 8px 0 0 ${A.coral}` }}
    >
      <div className="flex items-center gap-2 border-b-[3px] border-pg-border bg-pg-surface px-5 py-3">
        <AlertCircle className="size-3.5 text-pg-coral-ink" strokeWidth={2.5} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-pg-text-muted">
          Review Failed
        </span>
      </div>

      <div className="p-5">
        <p className="text-sm font-medium leading-relaxed text-pg-text-muted">
          {message || "Something went wrong while analyzing your approach."}
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t-[3px] border-pg-border bg-pg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
        <PlayButton
          onClick={onContinue}
          fill="#141419"
          shadow={A.cyan}
          text="#ffffff"
          className="!px-5 !py-2.5 text-[11px] uppercase tracking-widest"
        >
          Continue Anyway
          <ArrowRight className="size-3.5" strokeWidth={3} />
        </PlayButton>

        <PlayButton
          onClick={onRetry}
          fill={A.lime}
          shadow={A.coral}
          className="!px-6 !py-2.5 text-[11px] uppercase tracking-widest"
        >
          <RotateCcw className="size-3.5" strokeWidth={3} />
          Try Again
        </PlayButton>
      </div>
    </motion.div>
  );
}
