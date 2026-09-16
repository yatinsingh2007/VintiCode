"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

/*
  Shared feedback states.

  Previously every screen invented its own: some rendered a bare spinning
  ring, some a skeleton, some nothing at all. Empty lists showed a single
  grey sentence with no explanation or next step, and failed requests
  showed *nothing* — several pages left `loading` true forever on error,
  so a network failure looked identical to a slow load. These give every
  screen one vocabulary for loading / empty / error.
*/

export function Spinner({
  className,
  label = "Loading",
  ...props
}: React.ComponentProps<"span"> & { label?: string }) {
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex", className)} {...props}>
      <svg
        className="animate-spin text-current size-full"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center text-pg-text",
        "rounded-2xl border-[3px] border-pg-border bg-pg-surface",
        "px-6 py-14",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 grid size-12 place-items-center rounded-xl border-[3px] border-pg-border bg-pg-surface text-pg-text-muted">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <p className="text-base font-extrabold">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm font-medium text-pg-text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Check your connection and try again.",
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center text-pg-text",
        "rounded-2xl border-[3px] border-pg-border bg-pg-surface",
        "px-6 py-14",
        className
      )}
      style={{ boxShadow: "8px 8px 0 0 var(--pg-coral)" }}
    >
      <div className="mb-4 grid size-12 place-items-center rounded-xl border-[3px] border-pg-border bg-[var(--pg-coral)] text-black">
        <AlertTriangle className="size-5" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <p className="text-base font-extrabold">{title}</p>
      <p className="mt-1 max-w-sm text-sm font-medium text-pg-text-muted">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl border-[3px] border-pg-border bg-[var(--pg-lime)] px-4 py-2 text-sm font-extrabold text-black transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:scale-95"
        >
          <RefreshCw className="size-4" strokeWidth={2.5} aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  )
}

/** Consistent page title block: same rhythm and scale on every screen. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-3xl font-black tracking-tighter text-pg-text sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm font-medium text-pg-text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
