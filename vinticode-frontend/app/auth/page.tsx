"use client";
import { useState } from "react";
import Login from "@/section/Login";
import Signup from "@/section/Signup";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GridBeams } from "@/components/ui/grid-beams";
import { cn } from "@/lib/utils";

type Tab = "signup" | "login";

const TABS: { id: Tab; label: string }[] = [
  { id: "signup", label: "Sign Up" },
  { id: "login", label: "Login" },
];

export default function AuthPage(): React.ReactNode {
  const [activeTab, setActiveTab] = useState<Tab>("signup");

  return (
    <GridBeams className="flex min-h-svh w-full items-center justify-center p-4">
      {/*
        Was a <div onClick={router.push}>: not focusable, not keyboard
        operable, no accessible name, and no real href to open in a new
        tab. A Link is the correct element for navigation.
      */}
      <Link
        href="/"
        aria-label="Back to home"
        className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:bg-accent hover:text-foreground sm:left-5 sm:top-5"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Back</span>
      </Link>

      {/*
        Height is no longer pinned to 600px. The signup form is taller than
        login, so the fixed height forced it into an inner scroll area —
        which, with scrollbars globally hidden, gave no hint the rest of the
        form existed. The card now sizes to its content.
      */}
      <div className="relative z-10 w-full max-w-md">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div
            role="tablist"
            aria-label="Authentication"
            className="flex w-full border-b border-border"
            onKeyDown={(e) => {
              // Arrow-key navigation is expected of a tablist.
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              setActiveTab((t) => (t === "signup" ? "login" : "signup"));
            }}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={active}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex-1 cursor-pointer py-3.5 text-sm font-semibold",
                    "transition-colors duration-200",
                    "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  {tab.label}
                  {/* An underline reads as a tab; the previous full white
                      fill read as a pressed button and inverted contrast. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-0 bottom-0 h-0.5 origin-center transition-transform duration-200",
                      active ? "scale-x-100 bg-primary" : "scale-x-0 bg-transparent"
                    )}
                  />
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="p-5 sm:p-6"
          >
            {activeTab === "login" ? <Login /> : <Signup />}
          </div>
        </div>
      </div>
    </GridBeams>
  );
}
