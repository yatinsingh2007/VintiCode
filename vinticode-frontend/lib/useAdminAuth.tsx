"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import adminApi from "./adminApi";

export interface AdminUser {
  email: string;
}

export interface UseAdminAuth {
  admin: AdminUser | null;
  checking: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

/**
 * Admin auth state, shared through context.
 *
 * This was previously a plain hook holding local state. Because each caller
 * got its own independent copy, and because Next.js layouts do NOT remount on
 * client-side navigation, signing in produced an infinite redirect loop:
 *
 *   1. AdminLayout mounts at /admin/login → verify() → admin = null
 *   2. The login page calls POST /login on its own and pushes to /dashboard
 *   3. The layout never remounts, so ITS `admin` is still null → its guard
 *      redirects back to /admin/login
 *   4. The login page's own /verify now succeeds → it redirects to /dashboard
 *   5. → 3 → 4 → 3 … the page appears to refresh forever
 *
 * A hard reload (Cmd+R) "fixed" it only because that remounts the layout and
 * lets verify() populate `admin` before the guard runs.
 *
 * One provider = one source of truth: `login()` updates the same state the
 * layout's guard reads, so there is nothing left to disagree about.
 */
const AdminAuthContext = createContext<UseAdminAuth | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  const verify = useCallback(async (): Promise<boolean> => {
    try {
      const res = await adminApi.get<{ authenticated: boolean; email: string }>(
        "/verify"
      );
      if (res.data.authenticated) {
        setAdmin({ email: res.data.email });
        return true;
      }
      setAdmin(null);
      return false;
    } catch {
      setAdmin(null);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  // Verify the session once, for the whole admin subtree.
  useEffect(() => {
    verify();
  }, [verify]);

  const login = useCallback(
    async (email: string, password: string) => {
      // Throws on bad credentials; the login form catches and displays it.
      await adminApi.post("/login", { email, password });
      // Populates the shared state *before* navigating, so the layout's guard
      // already sees an authenticated admin when the dashboard renders.
      await verify();
      // replace(), not push(): the login screen should not sit in history
      // behind the dashboard, where Back would land on a dead page.
      router.replace("/admin/dashboard");
    },
    [router, verify]
  );

  const logout = useCallback(async () => {
    try {
      await adminApi.post("/logout");
    } catch {
      // Ignore: clear local state regardless so the user isn't stranded.
    }
    setAdmin(null);
    router.replace("/admin/login");
  }, [router]);

  return (
    <AdminAuthContext.Provider
      value={{ admin, checking, login, logout, refresh: verify }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): UseAdminAuth {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  }
  return ctx;
}
