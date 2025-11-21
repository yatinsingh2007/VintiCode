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
      href: "/auth",
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
                        <div
                          key={idx}
                          onClick={async (e) => {
                            try{
                              await api.get("/auth/logout");
                              toast.success("Logged out successfully");
                              router.push("/auth");
                            }catch(err : unknown){
                              toast.error("Logout failed");
                            }
                          }}
                        >
                          <SidebarLink link={link} />
                        </div>
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
  <div className="h-36 rounded-lg border border-neutral-800 bg-neutral-900 p-4 animate-pulse flex flex-col justify-between">
    <div className="space-y-3">
      <div className="h-5 w-3/4 bg-neutral-800 rounded" />
      <div className="h-4 w-full bg-neutral-800 rounded" />
    </div>
    <div className="h-5 w-20 bg-neutral-800 rounded" />
  </div>
);

const getDifficultyBadge = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return "text-green-400 border border-green-900";
    case "medium":
      return "text-yellow-400 border border-yellow-900";
    case "hard":
      return "text-red-400 border border-red-900";
    default:
      return "text-neutral-300 border border-neutral-700";
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
    <div className="flex-1 w-full bg-neutral-950 overflow-y-auto">

      <div className="border-b border-neutral-800 px-6 py-5 space-y-3">
        <h2 className="text-2xl font-bold text-white">Practice Questions</h2>
        <p className="text-sm text-neutral-500">
          Search, filter, and track your progress.
        </p>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 h-4 w-4" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-neutral-900 border-neutral-800 text-white"
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="bg-neutral-900 border-neutral-800 text-white min-w-[140px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!loading && (
          <p className="text-xs text-neutral-500">
            Showing {Math.min((page - 1) * itemsPerPage + 1, totalCount)}–
            {Math.min(page * itemsPerPage, totalCount)} of {totalCount}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {loading &&
          Array.from({ length: 9 }).map((_, idx) => <ShimmerCard key={idx} />)}

        {!loading &&
          paginatedQuestions.map((q) => (
            <div
              key={q.id}
              onClick={() => router.push(`/dashboard/question/${q.id}`)}
              className="group cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-700 transition"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-lg font-semibold text-white line-clamp-1">
                    {q.title}
                  </h4>

                  {q.done && (
                    <span className="text-xs flex items-center gap-1 text-green-400">
                      <CheckCircle2 className="h-3 w-3" /> Solved
                    </span>
                  )}
                </div>

                <p className="text-sm text-neutral-300 line-clamp-2">
                  {q.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`text-xs px-2 py-1 rounded-md font-medium ${getDifficultyBadge(
                    q.difficulty
                  )}`}
                >
                  {q.difficulty}
                </span>

                <span className="text-xs text-neutral-400 group-hover:text-neutral-200">
                  View →
                </span>
              </div>
            </div>
          ))}

        {!loading && paginatedQuestions.length === 0 && (
          <div className="col-span-full text-center py-10 text-neutral-400 border border-neutral-800 rounded-lg">
            No matching questions.
          </div>
        )}
      </div>

      <div className="border-t border-neutral-800 py-3 px-4">
        <DashboardPagination
          totalPages={totalPages}
          currentPage={page}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};
