"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "@/components/Logo";
import { Search, X, CheckCircle2, ListX, Inbox } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { EmptyState, ErrorState } from "@/components/ui/states";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconUserBolt,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DashboardPagination from "@/section/Pagination";
import {
  PlayInput,
  PlayButton,
  Bounce,
  PlaySurface,
  A,
} from "@/components/playground";

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

/* Difficulty → playground accent for sticker badges + card shadows. */
function diffColor(difficulty?: string) {
  switch (difficulty?.toLowerCase()) {
    case "easy":
      return A.lime;
    case "medium":
      return A.amber;
    case "hard":
      return A.coral;
    default:
      return A.cyan;
  }
}

export default function DashboardHomePage() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard/home",
      icon: <IconBrandTabler className="h-5 w-5 shrink-0 text-white/70" />,
    },
    {
      label: "Profile",
      href: "/dashboard/profile",
      icon: <IconUserBolt className="h-5 w-5 shrink-0 text-white/70" />,
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
    <div className="dark relative mx-auto flex h-svh w-full flex-1 flex-col bg-[#0a0a0d] text-white md:flex-row">
      <PlaySurface />
      <div className="z-10 border-black bg-[#0d0d11] md:border-r-[3px]">
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
                        <IconArrowLeft className="h-5 w-5 shrink-0 text-white/70" />
                      ),
                    }}
                  />
                </button>
              </nav>
            </div>
          </SidebarBody>
        </Sidebar>
      </div>

      <Dashboard />
    </div>
  );
}

/* Mirrors the real card's height and internal rhythm to avoid layout shift. */
const ShimmerCard = () => (
  <div className="flex h-[176px] flex-col justify-between rounded-2xl border-[3px] border-black bg-[#141419] p-5">
    <div className="space-y-3">
      <div className="h-5 w-3/4 animate-pulse rounded bg-white/10" />
      <div className="h-4 w-full animate-pulse rounded bg-white/10" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
    </div>
    <div className="flex items-center justify-between border-t-[3px] border-black/40 pt-4">
      <div className="h-6 w-16 animate-pulse rounded-lg bg-white/10" />
      <div className="h-4 w-12 animate-pulse rounded bg-white/10" />
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
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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
    <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-y-auto">
      <header className="sticky top-0 z-10 space-y-4 border-b-[3px] border-black bg-[#0a0a0d]/85 px-4 py-5 backdrop-blur-md sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className="inline-block -rotate-2 rounded-lg border-[3px] border-black px-2.5 py-0.5 font-mono text-[0.7rem] font-bold uppercase tracking-wider text-black shadow-[3px_3px_0_0_#000]"
              style={{ background: A.lime }}
            >
              Practice
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tighter text-white">
              Question Bank
            </h1>
            <p className="mt-1 text-sm font-medium text-white/60">
              Search, filter, and track your coding journey.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/40"
            />
            <PlayInput
              type="search"
              aria-label="Search questions"
              placeholder="Search questions…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-white/50 transition-colors hover:text-white"
                onClick={() => setSearchQuery("")}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger
                aria-label="Filter by difficulty"
                className="min-w-[140px] rounded-xl border-[3px] border-black bg-[#0d0d11] font-semibold"
              >
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="border-[3px] border-black bg-[#141419]">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <PlayButton
                onClick={clearFilters}
                fill="#141419"
                shadow={A.cyan}
                text="#ffffff"
                className="!px-4 !py-2 text-sm"
              >
                Clear
              </PlayButton>
            )}
          </div>
        </div>

        {!loading && !error && (
          <p aria-live="polite" className="text-xs font-semibold text-white/50">
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
            {paginatedQuestions.map((q, i) => {
              const color = diffColor(q.difficulty);
              return (
                <Bounce key={q.id} delay={(i % 9) * 0.04} tilt={0} hover={false}>
                  <Link
                    href={`/dashboard/question/${q.id}/scratchpad`}
                    className={cn(
                      "group flex h-[176px] flex-col justify-between rounded-2xl border-[3px] border-black bg-[#141419] p-5",
                      "transition-transform duration-150 hover:-translate-x-1 hover:-translate-y-1",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pg-cyan)]"
                    )}
                    style={{ boxShadow: `5px 5px 0 0 ${color}` }}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="line-clamp-1 text-lg font-extrabold tracking-tight text-white">
                          {q.title}
                        </h2>
                        {q.done && (
                          <span
                            className="inline-flex shrink-0 items-center gap-1 rounded-md border-2 border-black px-1.5 py-0.5 font-mono text-[0.65rem] font-bold text-black"
                            style={{ background: A.lime }}
                          >
                            <CheckCircle2 className="size-3" strokeWidth={3} aria-hidden="true" />
                            Solved
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm font-medium leading-relaxed text-white/55">
                        {q.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t-[3px] border-black/40 pt-4">
                      <span
                        className="inline-flex items-center rounded-md border-2 border-black px-2 py-0.5 font-mono text-[0.7rem] font-bold uppercase text-black"
                        style={{ background: color }}
                      >
                        {q.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-white/60 transition-colors group-hover:text-white">
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
                </Bounce>
              );
            })}
          </div>
        )}

        {!loading && !error && paginatedQuestions.length === 0 && (
          hasFilters ? (
            <EmptyState
              icon={ListX}
              title="No matching questions"
              description="No questions match your current search and filters."
              action={
                <PlayButton
                  onClick={clearFilters}
                  fill="#141419"
                  shadow={A.cyan}
                  text="#ffffff"
                  className="!px-4 !py-2 text-sm"
                >
                  Clear filters
                </PlayButton>
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

      {!loading && !error && totalPages > 1 && (
        <div className="sticky bottom-0 border-t-[3px] border-black bg-[#0a0a0d]/85 px-4 py-3 backdrop-blur-md sm:px-6">
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
