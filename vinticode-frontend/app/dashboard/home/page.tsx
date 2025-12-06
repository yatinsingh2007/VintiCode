"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { Logo, LogoIcon } from "@/components/Logo";
import { Search, X, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
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

export default function SidebarDemo() {
  return <SidebarDemoInner />;
}

function SidebarDemoInner() {
  const [data, setData] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard/home",
      icon: <IconBrandTabler className="h-5 w-5 text-neutral-300" />,
    },
    {
      label: "Profile",
      href: "/dashboard/profile",
      icon: <IconUserBolt className="h-5 w-5 text-neutral-300" />,
    },
    {
      label: "Logout",
      href: "/",
      icon: <IconArrowLeft className="h-5 w-5 text-neutral-300" />,
    },
  ];

  return (
    <div
      className={cn(
        "mx-auto flex w-full h-screen flex-1 flex-col md:flex-row bg-neutral-950 border border-neutral-900"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-8">
          <div className="flex flex-1 flex-col overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}

            <div className="mt-8 flex flex-col gap-1">
              {loading
                ? Array.from({ length: 4 }).map((_, idx) => (
                  <SidebarShimmer key={idx} />
                ))
                : links.map((link, idx) => {
                  if (link.label === "Logout") {
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="w-full text-left"
                        onClick={async () => {
                          try {
                            const res = await api.get("/auth/logout", {
                              withCredentials: true,
                            });

                            if (res.status === 200) {
                              toast.success("Logged out successfully");
                              router.push("/auth");
                            }
                          } catch (err) {
                            console.error(err);
                            toast.error("Logout failed");
                          }
                        }}
                      >
                        <SidebarLink link={{ ...link, href: "#" }} />
                      </button>
                    );
                  }

                  return <SidebarLink key={idx} link={link} />;
                })}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      <Dashboard
        data={data}
        loading={loading}
        setData={setData}
        setLoading={setLoading}
      />
    </div>
  );
}

const SidebarShimmer = () => (
  <div className="flex items-center space-x-2 px-2 py-2">
    <Skeleton className="h-5 w-5 bg-neutral-800 rounded" />
    <Skeleton className="h-4 w-20 bg-neutral-800 rounded" />
  </div>
);

const ShimmerCard = () => (
  <div className="h-40 rounded-xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900/50 to-neutral-900/30 backdrop-blur-sm p-5 animate-pulse flex flex-col justify-between shadow-lg">
    <div className="space-y-3">
      <div className="h-6 w-3/4 bg-neutral-800/60 rounded-lg" />
      <div className="h-4 w-full bg-neutral-800/40 rounded-md" />
      <div className="h-4 w-5/6 bg-neutral-800/40 rounded-md" />
    </div>
    <div className="flex justify-between items-center">
      <div className="h-6 w-20 bg-neutral-800/60 rounded-full" />
      <div className="h-4 w-16 bg-neutral-800/40 rounded" />
    </div>
  </div>
);

const getDifficultyBadge = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10";
    case "medium":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/10";
    case "hard":
      return "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-500/10";
    default:
      return "bg-neutral-500/10 text-neutral-300 border border-neutral-500/20";
  }
};

interface DashboardProps {
  data: Question[];
  loading: boolean;
  setData: React.Dispatch<React.SetStateAction<Question[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const Dashboard: React.FC<DashboardProps> = ({
  data,
  loading,
  setData,
  setLoading,
}) => {
  const [page, setPage] = useState(1);
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [paginatedQuestions, setPaginatedQuestions] = useState<Question[]>([]);

  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const router = useRouter();
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const resp = await api.get(`/dashboard/home`, {
          withCredentials: true
        });

        const questions = resp.data.questions || resp.data || [];
        setAllQuestions(questions);
        setData(questions);

      } catch (err: unknown) {
        toast.error("Failed to fetch data");

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 401) {
            router.push("/auth");
            return;
          }
        }

      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    let filtered = [...allQuestions];

    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(s) ||
          q.description.toLowerCase().includes(s)
      );
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter(
        (q) => q.difficulty.toLowerCase() === difficultyFilter.toLowerCase()
      );
    }

    setFilteredQuestions(filtered);
    setTotalCount(filtered.length);

    const total = Math.ceil(filtered.length / itemsPerPage) || 1;
    setTotalPages(total);

    if (page > total) setPage(1);
  }, [allQuestions, searchQuery, difficultyFilter]);

  useEffect(() => {
    const start = (page - 1) * itemsPerPage;
    const paginated = filteredQuestions.slice(start, start + itemsPerPage);

    setPaginatedQuestions(paginated);
    setData(paginated);
  }, [filteredQuestions, page]);

  return (
    <div className="flex-1 w-full bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 overflow-y-auto">

      <div className="border-b border-neutral-800/50 bg-neutral-900/30 backdrop-blur-md px-6 py-6 space-y-4 sticky top-0 z-10">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Practice Questions
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Search, filter, and track your coding journey.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 h-4 w-4" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-neutral-900/50 border-neutral-700/50 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-lg"
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="bg-neutral-900/50 border-neutral-700/50 text-white min-w-[140px] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-lg">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white rounded-lg">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!loading && (
          <p className="text-xs text-neutral-500">
            Showing {Math.min((page - 1) * itemsPerPage + 1, totalCount)}–
            {Math.min(page * itemsPerPage, totalCount)} of {totalCount} questions
          </p>
        )}
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
        {loading &&
          Array.from({ length: 9 }).map((_, idx) => <ShimmerCard key={idx} />)}

        {!loading &&
          paginatedQuestions.map((q) => (
            <div
              key={q.id}
              onClick={() => router.push(`/dashboard/question/${q.id}`)}
              className="group cursor-pointer rounded-xl border border-neutral-800/50 bg-gradient-to-br from-neutral-900/60 to-neutral-900/40 backdrop-blur-sm p-5 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-lg font-semibold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {q.title}
                  </h4>

                  {q.done && (
                    <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20 shrink-0">
                      <CheckCircle2 className="h-3 w-3" />
                      Solved
                    </span>
                  )}
                </div>

                <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">
                  {q.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-800/50 flex items-center justify-between">
                <span
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${getDifficultyBadge(
                    q.difficulty
                  )}`}
                >
                  {q.difficulty}
                </span>

                <span className="text-xs text-neutral-500 group-hover:text-blue-400 flex items-center gap-1 transition-colors">
                  View
                  <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </span>
              </div>
            </div>
          ))}

        {!loading && paginatedQuestions.length === 0 && (
          <div className="col-span-full text-center py-16 text-neutral-400 border border-neutral-800/50 rounded-xl bg-neutral-900/30 backdrop-blur-sm">
            <div className="space-y-2">
              <p className="text-lg font-medium">No matching questions found</p>
              <p className="text-sm text-neutral-500">Try adjusting your search or filters</p>
            </div>
          </div>
        )}
      </div>


      <div className="border-t border-neutral-800/50 bg-neutral-900/30 backdrop-blur-md py-4 px-6 sticky bottom-0">
        <DashboardPagination
          totalPages={totalPages}
          currentPage={page}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};
