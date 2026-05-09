"use client";

import { useState, useEffect, useCallback } from "react";
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
  refresh: () => Promise<void>;
}

/**
 * useAdminAuth
 * ─────────────
 * Provides authentication state and helpers for admin pages.
 *
 * - `checking`  → true while the /verify request is in-flight (prevents flicker)
 * - `admin`     → the authenticated admin's email, or null
 * - `login`     → POST /login, throws on error
 * - `logout`    → POST /logout, clears cookie, redirects to /admin/login
 * - `refresh`   → Manual re-verification of the session
 */
export function useAdminAuth(): UseAdminAuth {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  const verify = useCallback(async () => {
    try {
      const res = await adminApi.get<{ authenticated: boolean; email: string }>("/verify");
      if (res.data.authenticated) {
        setAdmin({ email: res.data.email });
      } else {
        setAdmin(null);
      }
    } catch (err) {
      setAdmin(null);
    } finally {
      setChecking(false);
    }
  }, []);

  // Verify session on mount
  useEffect(() => {
    verify();
  }, [verify]);

  const login = useCallback(
    async (email: string, password: string) => {
      await adminApi.post("/login", { email, password });
      await verify();
      router.push("/admin/dashboard");
    },
    [router, verify]
  );

  const logout = useCallback(async () => {
    try {
      await adminApi.post("/logout");
    } catch (_) {
      // Ignore
    }
    setAdmin(null);
    router.replace("/admin/login");
  }, [router]);

  return { admin, checking, login, logout, refresh: verify };
}

