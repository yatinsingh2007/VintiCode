import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
  Difficulty and submission-status pills were re-implemented inline on
  nearly every screen, each with slightly different padding, radius and
  colour (`bg-green-500/10 text-green-400` on one, `bg-emerald-500/15
  text-emerald-400` on another). Beyond the inconsistency, fixed -400 text
  is tuned for dark backgrounds and drops well below AA contrast in light
  mode. These variants read from semantic tokens that are tuned per theme.
*/
/*
  Playground badges: flat solid accent, thick black border, black text —
  a "sticker" pill. Colours come from the --pg-* CSS vars in globals.css.
*/
const badgeVariants = cva(
  [
    "inline-flex items-center justify-center gap-1 shrink-0 whitespace-nowrap",
    "rounded-md border-2 border-black px-2 py-0.5 text-xs font-bold font-mono uppercase w-fit",
    "[&>svg]:size-3 [&>svg]:pointer-events-none",
    "outline-none",
  ],
  {
    variants: {
      variant: {
        default: "bg-[var(--pg-lime)] text-black",
        secondary: "bg-[#141419] text-white",
        outline: "border-black bg-transparent text-white",
        muted: "bg-[#141419] text-white/70",
        success: "bg-[var(--pg-lime)] text-black",
        warning: "bg-[var(--pg-amber)] text-black",
        destructive: "bg-[var(--pg-coral)] text-black",
        info: "bg-[var(--pg-cyan)] text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

/** Maps a question difficulty to its badge variant. */
export function difficultyVariant(
  difficulty: string | null | undefined
): VariantProps<typeof badgeVariants>["variant"] {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return "success"
    case "medium":
      return "warning"
    case "hard":
      return "destructive"
    default:
      return "muted"
  }
}

/** Maps a submission status to its badge variant. */
export function statusVariant(
  status: string | null | undefined
): VariantProps<typeof badgeVariants>["variant"] {
  switch (status?.toLowerCase()) {
    case "accepted":
      return "success"
    case "rejected":
    case "error":
      return "destructive"
    case "pending":
    case "running":
      return "warning"
    default:
      return "muted"
  }
}

/** Title-cases a raw enum-ish string for display ("in_review" → "In Review"). */
export function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export { Badge, badgeVariants }
