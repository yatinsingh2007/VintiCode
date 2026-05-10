"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import adminApi from "@/lib/adminApi";
import { useAdminAuth } from "@/lib/useAdminAuth";
import toast from "react-hot-toast";
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
  Bell,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/questions", label: "Questions", icon: BookOpen },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/submissions", label: "Submissions", icon: FileCode2 },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────
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
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-[240px] flex flex-col
          bg-[#0d1117] border-r border-white/[0.06]
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto shadow-2xl
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/5 shrink-0">
            <Shield className="w-4.5 h-4.5 text-black" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-none">
              VintiCode
            </p>
            <p className="text-gray-400 text-xs mt-0.5">Admin Console</p>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-500 hover:text-white transition-colors"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
          aria-label="Admin navigation"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 group relative
                  ${
                    active
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-200 border border-transparent"
                  }
                `}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                    active
                      ? "text-white"
                      : "text-gray-600 group-hover:text-gray-400"
                  }`}
                />
                <span className="flex-1">{label}</span>
                {active && (
                  <ChevronRight className="w-3 h-3 text-white/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="px-3 pb-4 border-t border-white/[0.06] pt-4 space-y-2">
          {/* Admin identity */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
              <span className="text-black text-xs font-bold">
                {adminEmail ? adminEmail.charAt(0).toUpperCase() : "A"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">
                {adminEmail || "Admin"}
              </p>
              <p className="text-gray-600 text-[10px]">Administrator</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400/80 hover:bg-red-500/8 hover:text-red-400 transition-all duration-200 border border-transparent hover:border-red-500/15"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────
// Skeleton loading screen
// ─────────────────────────────────────────────
function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex flex-col w-[240px] bg-[#0d1117] border-r border-white/[0.06] p-4 gap-4">
        <div className="h-12 rounded-xl bg-white/5 animate-pulse" />
        <div className="space-y-2 mt-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-white/5 animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
        <div className="mt-auto space-y-2">
          <div className="h-10 rounded-lg bg-white/5 animate-pulse" />
          <div className="h-10 rounded-lg bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b border-white/[0.06] bg-[#0d1117] px-6 flex items-center gap-3">
          <div className="h-6 w-32 rounded bg-white/5 animate-pulse" />
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-white/5 animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Admin Layout
// ─────────────────────────────────────────────
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, checking, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Protected route check
  useEffect(() => {
    if (!checking && !admin && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [admin, checking, pathname, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const toastId = toast.loading("Signing out…", {
      style: {
        background: "#161b22",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.08)",
      },
    });
    await logout();
    toast.success("Signed out successfully.", {
      id: toastId,
      duration: 2000,
      style: {
        background: "#161b22",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.08)",
      },
    });
  };

  if (checking) {
    return <AdminSkeleton />;
  }


  // Get current page label for top bar
  const currentPage =
    NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    )?.label ?? "Admin";

  return (
    <div className="min-h-screen bg-[#0d1117] flex">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        adminEmail={admin?.email || ""}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 lg:px-6 h-14 border-b border-white/[0.06] bg-[#0d1117]/95 backdrop-blur-sm">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb / page title */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-200 font-medium">{currentPage}</span>
          </div>

          {/* Mobile: just the shield icon + page name */}
          <div className="flex items-center gap-2 lg:hidden">
            <Shield className="w-4 h-4 text-white" />
            <span className="text-white font-semibold text-sm">
              {currentPage}
            </span>
          </div>

          {/* Right: admin badge */}
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-400 text-xs font-medium truncate max-w-[160px]">
                {admin?.email}
              </span>
            </div>

            {/* Mobile: just avatar */}
            <div className="sm:hidden w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <span className="text-black text-xs font-bold">
                {admin?.email ? admin.email.charAt(0).toUpperCase() : "A"}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
