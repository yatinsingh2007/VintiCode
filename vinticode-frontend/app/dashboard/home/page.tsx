"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "@/components/Logo";
import { Search, X, CheckCircle2, ListX, Inbox } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge, difficultyVariant } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/ui/states";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconUserBolt,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import DashboardPagination from "@/section/Pagination";

interface TestCases {
  sample_input: string[];
  sample_output: string[];
}

interface Question {
  id: string;
  title: string;
  description: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  test_cases: TestCases[];
  difficulty: string;
  createdAt: Date;
  updatedAt: Date;
  done: boolean;
}

const ITEMS_PER_PAGE = 9;

export default function DashboardHomePage() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard/home",
      icon: <IconBrandTabler className="h-5 w-5 shrink-0 text-muted-foreground" />,
    },
    {
      label: "Profile",
      href: "/dashboard/profile",
      icon: <IconUserBolt className="h-5 w-5 shrink-0 text-muted-foreground" />,
    },
  ];

  const handleLogout = async () => {
    try {
      const res = await api.get("/auth/logout", { withCredentials: true });
      if (res.status === 200) {
        toast.success("Logged out successfully");
        router.push("/auth");
      }
    } catch (err) {
      console.error(err);
      toast.error("Logout failed");
    }
  };

  return (
    <div className="mx-auto flex h-svh w-full flex-1 flex-col bg-background md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-8">
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}

            <nav aria-label="Main" className="mt-8 flex flex-col gap-1">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}

              <button
                type="button"
                className="w-full cursor-pointer text-left"
                onClick={handleLogout}
              >
                <SidebarLink
                  link={{
                    label: "Logout",
                    href: "#",
                    icon: (
                      <IconArrowLeft className="h-5 w-5 shrink-0 text-muted-foreground" />
                    ),
                  }}
                />
              </button>
            </nav>
          </div>
        </SidebarBody>
      </Sidebar>

      <Dashboard />
    </div>
  );
}

/* Mirrors the real card's height and internal rhythm to avoid layout shift. */
const ShimmerCard = () => (
  <div className="flex h-[168px] flex-col justify-between rounded-xl border border-border bg-card p-5">
    <div className="space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="flex items-center justify-between border-t border-border pt-4">
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-4 w-12" />
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const resp = await api.get(`/dashboard/home`, { withCredentials: true });
      setAllQuestions(resp.data.questions || resp.data || []);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push("/auth");
        return;
      }
      // Previously only a toast fired and the grid rendered as "no matching
      // questions found" — a failed request was indistinguishable from an
      // empty result set, and there was no way to retry without a reload.
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  /*
    Filtering was spread across two effects that mirrored derived data into
    three extra state variables, so every keystroke triggered a cascade of
    re-renders and a frame where the list disagreed with the filters.
    It's plain derived data — useMemo is enough.
  */
  const filteredQuestions = useMemo(() => {
    const s = searchQuery.trim().toLowerCase();
    return allQuestions.filter((q) => {
      const matchesSearch =
        !s ||
        q.title.toLowerCase().includes(s) ||
        q.description.toLowerCase().includes(s);
      const matchesDifficulty =
        difficultyFilter === "all" ||
        q.difficulty?.toLowerCase() === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [allQuestions, searchQuery, difficultyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE));

  // Keep the page in range when filters shrink the result set.
  useEffect(() => {
    setPage(1);
  }, [searchQuery, difficultyFilter]);

  const paginatedQuestions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, page]);

  const hasFilters = searchQuery.trim() !== "" || difficultyFilter !== "all";
  const clearFilters = () => {
    setSearchQuery("");
    setDifficultyFilter("all");
  };

  const solvedCount = allQuestions.filter((q) => q.done).length;

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background">
      <header className="sticky top-0 z-10 space-y-4 border-b border-border bg-background/80 px-4 py-5 backdrop-blur-md sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {/* The gradient blue→cyan clip-text heading was the only element
                of its kind in the app and lowered contrast against both
                themes. A solid heading is calmer and reads as more premium. */}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Practice Questions
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Search, filter, and track your coding journey.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label="Search questions"
              placeholder="Search questions…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-0 top-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setSearchQuery("")}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger aria-label="Filter by difficulty" className="min-w-[140px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {/*
          A live result count: the list previously changed silently as you
          typed, giving no confirmation the filter had applied and no sense
          of overall progress.
        */}
        {!loading && !error && (
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {filteredQuestions.length}{" "}
            {filteredQuestions.length === 1 ? "question" : "questions"}
            {hasFilters && ` of ${allQuestions.length}`}
            {solvedCount > 0 && !hasFilters && ` · ${solvedCount} solved`}
          </p>
        )}
      </header>

      <div className="flex-1 p-4 sm:p-6">
        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
              <ShimmerCard key={idx} />
            ))}
          </div>
        )}

        {!loading && error && (
          <ErrorState
            title="Couldn't load questions"
            description="Something went wrong while fetching the question list."
            onRetry={fetchQuestions}
          />
        )}

        {!loading && !error && paginatedQuestions.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedQuestions.map((q) => (
              /*
                Was a <div onClick>: unreachable by keyboard, invisible to
                assistive tech, and impossible to open in a new tab. A Link
                restores all three for free.
              */
              <Link
                key={q.id}
                href={`/dashboard/question/${q.id}/scratchpad`}
                className={cn(
                  "group flex h-[168px] flex-col justify-between rounded-xl border border-border bg-card p-5",
                  "shadow-xs transition-[border-color,box-shadow,transform] duration-200",
                  "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-1 font-semibold text-foreground transition-colors group-hover:text-primary-fg">
                      {q.title}
                    </h2>
                    {q.done && (
                      <Badge variant="success" className="shrink-0">
                        <CheckCircle2 aria-hidden="true" />
                        Solved
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {q.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <Badge variant={difficultyVariant(q.difficulty)}>
                    {q.difficulty}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary-fg">
                    View
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform duration-200 group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Distinguishes "you filtered everything out" (recoverable, with a
            way out) from "there's genuinely nothing here yet". */}
        {!loading && !error && paginatedQuestions.length === 0 && (
          hasFilters ? (
            <EmptyState
              icon={ListX}
              title="No matching questions"
              description="No questions match your current search and filters."
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No questions available yet"
              description="Check back soon — new practice questions are added regularly."
            />
          )
        )}
      </div>

      {/* Pagination is meaningless with a single page; hiding it removes a
          permanently-disabled control from the bottom of the screen. */}
      {!loading && !error && totalPages > 1 && (
        <div className="sticky bottom-0 border-t border-border bg-background/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <DashboardPagination
            totalPages={totalPages}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};
