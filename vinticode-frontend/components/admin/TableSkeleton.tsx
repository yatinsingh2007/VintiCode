"use client";

import React from "react";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

/*
  Deterministic cell widths.

  These were `Math.random()` evaluated during render, which caused two
  problems: the server and client produced different widths (a hydration
  mismatch), and every re-render reshuffled every bar, so the placeholder
  visibly twitched while loading. A fixed cycle keeps the organic, uneven
  look without any of that.
*/
const WIDTHS = ["82%", "64%", "93%", "71%", "88%", "60%", "76%"];

export default function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  return (
    <div
      className="w-full overflow-hidden rounded-xl border border-border bg-card"
      // Announce the wait instead of leaving assistive tech with a silent,
      // meaningless table of empty cells.
      role="status"
      aria-live="polite"
      aria-label="Loading table data"
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-4">
                  {/* bg-muted bars on a bg-muted header row rendered the
                      header skeleton completely invisible. */}
                  <div className="h-4 w-24 animate-pulse rounded bg-border-strong" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
              // No hover highlight: a placeholder that lights up on hover
              // reads as an interactive row that isn't there yet.
              <tr key={i}>
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j} className="whitespace-nowrap px-6 py-4">
                    <div
                      className="h-4 animate-pulse rounded bg-muted"
                      style={{
                        width: WIDTHS[(i * cols + j) % WIDTHS.length],
                        animationDelay: `${i * 100 + j * 50}ms`,
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
