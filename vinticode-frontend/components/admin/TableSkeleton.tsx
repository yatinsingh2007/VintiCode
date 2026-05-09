"use client";

import React from "react";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export default function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-[#0d1117]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="group transition-colors hover:bg-white/[0.01]">
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j} className="whitespace-nowrap px-6 py-4">
                    <div
                      className="h-4 animate-pulse rounded bg-white/5"
                      style={{
                        width: `${Math.floor(Math.random() * (100 - 60 + 1) + 60)}%`,
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
