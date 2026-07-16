"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AdminAuthProvider, useAdminAuth } from "@/lib/useAdminAuth";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
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
        className={`fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/*
        `h-full` is correct while the drawer is `fixed` (its containing block
        is the viewport), but wrong once it becomes `lg:static`: height:100%
        against a parent that only sets `min-h-screen` has no definite height
        to resolve against, so it collapsed to content height and the sidebar
        surface stopped under "Sign Out". `lg:h-auto` hands sizing back to the
        flex row's default `align-items: stretch`, which fills the container
        whether the page is viewport-height or taller.
      */}
      <aside
        aria-label="Admin sidebar"
        className={`
          fixed top-0 left-0 z-40 flex h-full w-[248px] flex-col
          bg-sidebar border-r border-sidebar-border
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto lg:h-auto
        `}
      >
        {/* Brand — height matches the top bar so the two rules align */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Shield className="size-4 text-primary-foreground" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-sidebar-foreground">
              VintiCode
            </p>
            <p className="text-[11px] leading-tight text-muted-foreground">
              Admin Console
            </p>
          </div>
          <button
            className="ml-auto rounded-md p-1 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav
          className="flex-1 space-y-1 overflow-y-auto p-3"
          aria-label="Admin navigation"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                // aria-current is what tells a screen reader which page it's
                // on; colour alone conveyed this before.
                aria-current={active ? "page" : undefined}
                className={`
                  group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                  transition-colors duration-150
                  ${
                    active
                      ? "bg-primary-subtle text-primary-fg"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  }
                `}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                  />
                )}
                <Icon
                  aria-hidden="true"
                  className={`size-4 shrink-0 transition-colors duration-150 ${
                    active
                      ? "text-primary-fg"
                      : "text-muted-foreground group-hover:text-sidebar-foreground"
                  }`}
                />
                <span className="flex-1 truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/60 px-3 py-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-[11px] font-semibold">
                {adminEmail ? adminEmail.charAt(0).toUpperCase() : "A"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {adminEmail || "Admin"}
              </p>
              <p className="text-[10px] text-muted-foreground">Administrator</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-destructive-subtle hover:text-destructive-fg"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

/*
  Mirrors the real layout's geometry (248px rail, 14px-tall bar, same grid
  and radii) so the page doesn't visibly reflow when content arrives.
*/
function AdminSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-[248px] shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar p-3 lg:flex">
        <div className="flex h-14 items-center gap-3 border-b border-sidebar-border pb-3">
          <Skeleton className="size-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-14" />
          </div>
        </div>
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-lg" />
          ))}
        </div>
        <div className="mt-auto space-y-2">
          <Skeleton className="h-11 rounded-lg" />
          <Skeleton className="h-9 rounded-lg" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center border-b border-border px-6">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-6 p-4 lg:p-6 xl:p-8">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[86px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/*
  The provider must sit ABOVE every consumer, and the login page is rendered
  as `children` of this layout — so the state it writes on sign-in is the same
  state this layout's redirect guard reads. That shared instance is what stops
  the two from fighting each other over the route.
*/
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

  // Body scroll lock while the drawer is open, so the page behind it
  // doesn't scroll under the user's finger.
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

  /*
    The login page renders inside this layout too. It previously got the
    full chrome-less treatment only by accident; returning children early
    keeps the shell (and its auth-gated sidebar) off the login screen.
  */
  if (isLoginPage) return <>{children}</>;

  if (checking) return <AdminSkeleton />;

  const currentPage =
    NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    )?.label ?? "Admin";

  return (
    /*
      h-screen (not min-h-screen) so <main>'s `overflow-auto` has a definite
      height to scroll inside. With min-h-screen the whole document scrolled
      instead, dragging the sidebar and its nav up out of view on long pages.
      Now the rail stays put and only the content pane scrolls.
    */
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        adminEmail={admin?.email || ""}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
            aria-label="Open sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu className="size-5" />
          </button>

          <nav aria-label="Breadcrumb" className="hidden lg:block">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>Admin</li>
              <li aria-hidden="true">
                <ChevronRight className="size-3" />
              </li>
              <li className="font-medium text-foreground" aria-current="page">
                {currentPage}
              </li>
            </ol>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <span className="text-sm font-semibold text-foreground">
              {currentPage}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 sm:flex">
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full bg-success"
              />
              <span className="max-w-[160px] truncate text-xs font-medium text-muted-foreground">
                {admin?.email}
              </span>
            </div>
            <ThemeToggle size="icon-sm" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
