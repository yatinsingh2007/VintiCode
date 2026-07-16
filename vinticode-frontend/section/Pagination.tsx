"use client";

import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardPaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

/**
 * Builds a windowed page list around the current page:
 *   1 … 4 5 [6] 7 8 … 20
 *
 * The previous implementation rendered `Array.from({length: min(totalPages,10)})`
 * — always pages 1-10, regardless of where you were. On page 14 of 20 the
 * control showed pages 1-10 with the current page nowhere among them, so
 * there was no way to reach an adjacent page except one Next click at a time.
 */
function buildPages(current: number, total: number): (number | "gap")[] {
  const SIBLINGS = 1; // pages either side of current
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const left = Math.max(2, current - SIBLINGS);
  const right = Math.min(total - 1, current + SIBLINGS);

  const pages: (number | "gap")[] = [1];
  if (left > 2) pages.push("gap");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("gap");
  pages.push(total);
  return pages;
}

const DashboardPagination: React.FC<DashboardPaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const pages = buildPages(currentPage, totalPages);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className="flex w-full items-center justify-center gap-1"
    >
      {/*
        Rebuilt on <button>. The shadcn PaginationLink renders an <a> with no
        href, which browsers do not make focusable — so every page control
        here was unreachable by keyboard.

        Prev/Next were also always enabled and merely clamped their value, so
        clicking "Prev" on page 1 looked like a working control that did
        nothing. Disabling them communicates the boundary.
      */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={isFirst}
        aria-label="Go to previous page"
      >
        <ChevronLeft aria-hidden="true" />
        <span className="hidden sm:inline">Prev</span>
      </Button>

      <ul className="flex flex-row items-center gap-1">
        {pages.map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true">
              <span className="flex size-8 items-center justify-center text-muted-foreground">
                <MoreHorizontal className="size-4" />
              </span>
            </li>
          ) : (
            <li key={p}>
              <Button
                variant={p === currentPage ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => onPageChange(p)}
                aria-label={`Go to page ${p}`}
                aria-current={p === currentPage ? "page" : undefined}
                className="tabular-nums"
              >
                {p}
              </Button>
            </li>
          )
        )}
      </ul>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={isLast}
        aria-label="Go to next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
};

export default DashboardPagination;
