"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AdminAuthProvider, useAdminAuth } from "@/lib/useAdminAuth";
import toast from "react-hot-toast";
import { A } from "@/components/playground";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileCode2,
  LogOut,
  ChevronRight,
  Shield,
  Menu,
  X,
  BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/questions", label: "Questions", icon: BookOpen },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/submissions", label: "Submissions", icon: FileCode2 },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

function AdminSidebar({
  open,
  onClose,
  adminEmail,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  adminEmail: string;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Admin sidebar"
        className={`
          fixed top-0 left-0 z-40 flex h-full w-[248px] flex-col
          bg-[#0d0d11] border-r-[3px] border-black
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto lg:h-auto
        `}
      >
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b-[3px] border-black px-4">
          <div
            className="grid size-8 shrink-0 place-items-center rounded-lg border-[3px] border-black text-black"
            style={{ background: A.lime }}
          >
            <Shield className="size-4" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold leading-tight tracking-tight text-white">
              VintiCode
            </p>
            <p className="text-[11px] font-medium leading-tight text-white/45">
              Admin Console
            </p>
          </div>
          <button
            className="ml-auto rounded-md p-1 text-white/50 transition-colors hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav
          className="flex-1 space-y-1.5 overflow-y-auto p-3"
          aria-label="Admin navigation"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                style={active ? { background: A.lime } : undefined}
                className={`
                  group flex items-center gap-3 rounded-lg border-[3px] px-3 py-2 text-sm font-bold
                  transition-colors duration-150
                  ${
                    active
                      ? "border-black text-black"
                      : "border-transparent text-white/60 hover:border-black hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon
                  aria-hidden="true"
                  className="size-4 shrink-0"
                  strokeWidth={2.5}
                />
                <span className="flex-1 truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t-[3px] border-black p-3">
          <div className="flex items-center gap-3 rounded-lg border-[3px] border-black bg-[#141419] px-3 py-2">
            <div
              className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-black text-black"
              style={{ background: A.cyan }}
            >
              <span className="text-[11px] font-black">
                {adminEmail ? adminEmail.charAt(0).toUpperCase() : "A"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">
                {adminEmail || "Admin"}
              </p>
              <p className="text-[10px] font-medium text-white/45">Administrator</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-[3px] border-transparent px-3 py-2 text-sm font-bold text-white/60 transition-colors duration-150 hover:border-black hover:text-[var(--pg-coral)]"
          >
            <LogOut className="size-4" strokeWidth={2.5} aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

function AdminSkeleton() {
  return (
    <div className="dark flex min-h-screen bg-[#0a0a0d]">
      <div className="hidden w-[248px] shrink-0 flex-col gap-4 border-r-[3px] border-black bg-[#0d0d11] p-3 lg:flex">
        <div className="flex h-14 items-center gap-3 border-b-[3px] border-black pb-3">
          <div className="size-8 animate-pulse rounded-lg bg-white/10" />
          <div className="space-y-1.5">
            <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
            <div className="h-2 w-14 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-white/10" />
          ))}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center border-b-[3px] border-black px-6">
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        </div>
        <div className="space-y-6 p-4 lg:p-6 xl:p-8">
          <div className="space-y-2">
            <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-64 animate-pulse rounded bg-white/10" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[86px] animate-pulse rounded-2xl bg-white/10" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminAuthProvider>
  );
}

function AdminLayoutInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, checking, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!checking && !admin && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [admin, checking, isLoginPage, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Escape closes the mobile drawer — expected of any overlay nav.
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  // Body scroll lock while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    const toastId = toast.loading("Signing out…");
    await logout(); // Never rejects: clears local state even if the call fails.
    toast.success("Signed out successfully.", { id: toastId });
  };

  if (isLoginPage) return <>{children}</>;

  if (checking) return <AdminSkeleton />;

  const currentPage =
    NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    )?.label ?? "Admin";

  return (
    <div className="dark flex h-screen overflow-hidden bg-[#0a0a0d] text-white">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        adminEmail={admin?.email || ""}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b-[3px] border-black bg-[#0a0a0d]/85 px-4 backdrop-blur-md lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="cursor-pointer rounded-md p-1.5 text-white/60 transition-colors hover:text-white lg:hidden"
            aria-label="Open sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu className="size-5" />
          </button>

          <nav aria-label="Breadcrumb" className="hidden lg:block">
            <ol className="flex items-center gap-2 text-sm font-semibold text-white/50">
              <li>Admin</li>
              <li aria-hidden="true">
                <ChevronRight className="size-3" />
              </li>
              <li className="font-extrabold text-white" aria-current="page">
                {currentPage}
              </li>
            </ol>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <span className="text-sm font-extrabold text-white">{currentPage}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border-[3px] border-black bg-[#141419] px-3 py-1.5 sm:flex">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full border border-black"
                style={{ background: A.lime }}
              />
              <span className="max-w-[160px] truncate text-xs font-bold text-white/70">
                {admin?.email}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
