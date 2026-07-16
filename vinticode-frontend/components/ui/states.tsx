"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
        "flex flex-col items-center justify-center text-center",
        "rounded-xl border border-dashed border-border bg-muted/30",
        "px-6 py-14",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <p className="text-base font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
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
        "flex flex-col items-center justify-center text-center",
        "rounded-xl border border-destructive/20 bg-destructive-subtle",
        "px-6 py-14",
        className
      )}
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive-fg">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </div>
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
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
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
