"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "@/components/Logo";
import {
  Search,
  X,
  Check,
  ListX,
  Inbox,
  Trophy,
  MapPin,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "motion/react";
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

const ITEMS_PER_PAGE = 8;

/* Difficulty → playground accent for node rings, badges & shadows. */
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

/* ── Progress hero ───────────────────────────────────────────────────
   The "journey status" panel: overall completion meter + per-difficulty
   tally + a jump-back-in button pointing at the next unsolved problem.
   Only real data (done flags + difficulty) — no invented streaks. */
type DiffKey = "easy" | "medium" | "hard";
const DIFFS: { key: DiffKey; label: string }[] = [
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
];

const ProgressHero: React.FC<{
  total: number;
  solved: number;
  breakdown: Record<DiffKey, { total: number; solved: number }>;
  next?: Question;
}> = ({ total, solved, breakdown, next }) => {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

  return (
    <div className="rounded-2xl border-[3px] border-black bg-[#141419] p-5 shadow-[6px_6px_0_0_var(--pg-indigo)] sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Completion meter */}
        <div className="min-w-0 flex-1">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[0.7rem] font-bold uppercase tracking-wider text-white/50">
                Your journey
              </p>
              <p className="mt-1 text-2xl font-black tracking-tight text-white">
                {solved}
                <span className="text-white/40"> / {total} cleared</span>
              </p>
            </div>
            <span
              className="shrink-0 rounded-lg border-[3px] border-black px-2.5 py-1 font-mono text-sm font-black text-black"
              style={{ background: A.lime }}
            >
              {pct}%
            </span>
          </div>

          <div className="mt-3 h-4 w-full overflow-hidden rounded-full border-[3px] border-black bg-[#0d0d11]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: A.lime }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        {/* Difficulty tally */}
        <div className="grid grid-cols-3 gap-2.5 lg:w-[340px]">
          {DIFFS.map(({ key, label }) => {
            const b = breakdown[key];
            const c = diffColor(key);
            return (
              <div
                key={key}
                className="rounded-xl border-[3px] border-black bg-[#0d0d11] p-3 text-center"
              >
                <span
                  className="inline-block size-3 rounded-full border-2 border-black align-middle"
                  style={{ background: c }}
                />
                <p className="mt-1.5 text-lg font-black tabular-nums text-white">
                  {b.solved}
                  <span className="text-sm text-white/35">/{b.total}</span>
                </p>
                <p className="font-mono text-[0.6rem] font-bold uppercase tracking-wider text-white/50">
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Resume */}
        {next && (
          <Link
            href={`/dashboard/question/${next.id}/scratchpad`}
            className="group inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border-[3px] border-black px-5 py-3 text-base font-extrabold tracking-tight text-black shadow-[5px_5px_0_0_#000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 lg:self-auto"
            style={{ background: A.cyan }}
          >
            <MapPin className="size-4" strokeWidth={3} />
            Resume trail
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={3} />
          </Link>
        )}
      </div>
    </div>
  );
};

/* Smooth vertical-tangent S-curve between two points → a "winding road" feel. */
function segPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dy = b.y - a.y;
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + dy * 0.5} ${b.x} ${b.y - dy * 0.5} ${b.x} ${b.y}`;
}

const ROW = 172; // vertical gap between node centers
const TOP = 46; // padding above first node
const TILE_W = 184; // node tile width (for edge clamping)
const CIRC = 62; // node circle diameter

/* ── Roadmap trail ───────────────────────────────────────────────────
   Questions become nodes on a serpentine path measured against the live
   container width. Solved nodes are lit; the first unsolved is "here". */
const RoadmapTrail: React.FC<{
  questions: Question[];
  startNumber: number;
  currentId?: string;
  isFinalStage: boolean;
}> = ({ questions, startNumber, currentId, isFinalStage }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const amp = width < 640 ? 0.14 : 0.3;
  const half = TILE_W / 2 + 6;

  const points = useMemo(
    () =>
      questions.map((_, i) => {
        const frac = 0.5 + amp * Math.sin((i * Math.PI) / 2);
        const x = Math.min(Math.max(frac * width, half), Math.max(width - half, half));
        return { x, y: TOP + i * ROW };
      }),
    [questions, width, amp, half]
  );

  const svgHeight = TOP + (questions.length - 1) * ROW;
  const contentHeight = svgHeight + 150; // room for last node's label + finish marker

  return (
    <div ref={ref} className="relative w-full" style={{ height: contentHeight }}>
      {width > 0 && (
        <>
          {/* The path itself — each segment coloured by whether it's been cleared. */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={width}
            height={contentHeight}
            viewBox={`0 0 ${width} ${contentHeight}`}
            fill="none"
            aria-hidden
          >
            {points.slice(0, -1).map((p, i) => {
              const cleared = questions[i].done && questions[i + 1].done;
              return (
                <g key={i}>
                  {/* black casing for the chunky brutalist rail */}
                  <path d={segPath(p, points[i + 1])} stroke="#000" strokeWidth={12} strokeLinecap="round" />
                  <path
                    d={segPath(p, points[i + 1])}
                    stroke={cleared ? A.lime : "#2a2a33"}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={cleared ? undefined : "1 14"}
                  />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {questions.map((q, i) => {
            const p = points[i];
            const c = diffColor(q.difficulty);
            const isCurrent = q.id === currentId;
            const solved = q.done;
            return (
              <motion.div
                key={q.id}
                className="absolute flex flex-col items-center"
                style={{
                  left: p.x,
                  top: p.y - CIRC / 2,
                  width: TILE_W,
                  transform: "translateX(-50%)",
                }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: i * 0.05 }}
              >
                <Link
                  href={`/dashboard/question/${q.id}/scratchpad`}
                  aria-label={`Question ${startNumber + i}: ${q.title}${solved ? " (solved)" : ""}`}
                  className="group flex flex-col items-center focus:outline-none"
                >
                  {/* Node circle */}
                  <div className="relative">
                    {isCurrent && (
                      <span
                        className="absolute -inset-1 animate-ping rounded-full opacity-60"
                        style={{ background: A.cyan }}
                        aria-hidden
                      />
                    )}
                    <motion.div
                      whileHover={{ y: -4, scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 400, damping: 12 }}
                      className="relative grid place-items-center rounded-full border-[3px] border-black font-black"
                      style={{
                        width: CIRC,
                        height: CIRC,
                        background: solved ? A.lime : isCurrent ? A.cyan : "#1c1c22",
                        color: solved || isCurrent ? "#000" : c,
                        boxShadow: `4px 4px 0 0 ${solved ? "#000" : c}`,
                      }}
                    >
                      {solved ? (
                        <Check className="size-7" strokeWidth={4} />
                      ) : (
                        <span className="text-lg tabular-nums">{startNumber + i}</span>
                      )}
                    </motion.div>

                    {isCurrent && (
                      <span
                        className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border-2 border-black px-2 py-0.5 font-mono text-[0.6rem] font-black uppercase tracking-wider text-black shadow-[2px_2px_0_0_#000]"
                        style={{ background: A.cyan }}
                      >
                        You&apos;re here
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-2.5 flex flex-col items-center text-center">
                    <span
                      className={cn(
                        "line-clamp-1 max-w-full text-sm font-extrabold tracking-tight transition-colors",
                        solved ? "text-white" : "text-white/80 group-hover:text-white"
                      )}
                    >
                      {q.title}
                    </span>
                    <span
                      className="mt-1 inline-flex items-center rounded-md border-2 border-black px-1.5 py-0.5 font-mono text-[0.6rem] font-bold uppercase text-black"
                      style={{ background: c }}
                    >
                      {q.difficulty}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* Finish marker at the end of the final stage */}
          {isFinalStage && points.length > 0 && (
            <div
              className="absolute flex flex-col items-center"
              style={{
                left: width / 2,
                top: svgHeight + 40,
                transform: "translateX(-50%)",
              }}
            >
              <div
                className="grid size-14 place-items-center rounded-full border-[3px] border-black shadow-[4px_4px_0_0_#000]"
                style={{ background: A.amber }}
              >
                <Trophy className="size-7 text-black" strokeWidth={2.5} />
              </div>
              <span className="mt-2 font-mono text-[0.65rem] font-bold uppercase tracking-wider text-white/50">
                End of trail
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* Trail-shaped loading placeholder to avoid a jarring blank → path swap. */
const TrailSkeleton = () => (
  <div className="flex flex-col items-center gap-8 py-6">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="flex flex-col items-center"
        style={{ transform: `translateX(${[0, 90, 0, -90, 0][i]}px)` }}
      >
        <div className="size-[62px] animate-pulse rounded-full border-[3px] border-black bg-white/10" />
        <div className="mt-2.5 h-4 w-28 animate-pulse rounded bg-white/10" />
      </div>
    ))}
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

  const breakdown = useMemo(() => {
    const g: Record<DiffKey, { total: number; solved: number }> = {
      easy: { total: 0, solved: 0 },
      medium: { total: 0, solved: 0 },
      hard: { total: 0, solved: 0 },
    };
    for (const q of allQuestions) {
      const k = q.difficulty?.toLowerCase() as DiffKey;
      if (g[k]) {
        g[k].total++;
        if (q.done) g[k].solved++;
      }
    }
    return g;
  }, [allQuestions]);

  // First unsolved question in the whole bank = where "you are" on the trail.
  const currentQuestion = useMemo(
    () => allQuestions.find((q) => !q.done),
    [allQuestions]
  );

  return (
    <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-y-auto">
      <header className="sticky top-0 z-10 space-y-4 border-b-[3px] border-black bg-[#0a0a0d]/85 px-4 py-5 backdrop-blur-md sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className="inline-block -rotate-2 rounded-lg border-[3px] border-black px-2.5 py-0.5 font-mono text-[0.7rem] font-bold uppercase tracking-wider text-black shadow-[3px_3px_0_0_#000]"
              style={{ background: A.lime }}
            >
              The Trail
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tighter text-white">
              Your Coding Journey
            </h1>
            <p className="mt-1 text-sm font-medium text-white/60">
              Follow the path — plan your approach, then conquer each problem.
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
              placeholder="Search the trail…"
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
            {filteredQuestions.length === 1 ? "stop" : "stops"}
            {hasFilters && ` of ${allQuestions.length}`}
            {solvedCount > 0 && !hasFilters && ` · ${solvedCount} cleared`}
          </p>
        )}
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 sm:p-6">
        {loading && <TrailSkeleton />}

        {!loading && error && (
          <ErrorState
            title="Couldn't load the trail"
            description="Something went wrong while fetching your questions."
            onRetry={fetchQuestions}
          />
        )}

        {!loading && !error && (
          <>
            {!hasFilters && (
              <ProgressHero
                total={allQuestions.length}
                solved={solvedCount}
                breakdown={breakdown}
                next={currentQuestion}
              />
            )}

            {paginatedQuestions.length > 0 ? (
              <>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center">
                    <span
                      className="rounded-lg border-[3px] border-black px-3 py-1 font-mono text-[0.7rem] font-bold uppercase tracking-wider text-black shadow-[3px_3px_0_0_#000]"
                      style={{ background: A.amber }}
                    >
                      Stage {page} of {totalPages}
                    </span>
                  </div>
                )}
                <RoadmapTrail
                  key={`${page}-${searchQuery}-${difficultyFilter}`}
                  questions={paginatedQuestions}
                  startNumber={(page - 1) * ITEMS_PER_PAGE + 1}
                  currentId={currentQuestion?.id}
                  isFinalStage={page === totalPages}
                />
              </>
            ) : hasFilters ? (
              <EmptyState
                icon={ListX}
                title="No matching stops"
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
                title="The trail is empty"
                description="Check back soon — new practice questions are added regularly."
              />
            )}
          </>
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
