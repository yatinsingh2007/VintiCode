"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/useAdminAuth";
import toast from "react-hot-toast";
import {
  Shield,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { PlayScreen, PlayCard, PlayButton, A } from "@/components/playground";

// ─────────────────────────────────────────────
// Input field component
// ─────────────────────────────────────────────
function AdminInput({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  icon: Icon,
  autoComplete,
  rightElement,
  disabled,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ElementType;
  autoComplete?: string;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/70">
        {label}
      </label>
      <div className="relative flex items-center rounded-xl border-[3px] border-black bg-[#0d0d11] transition-shadow focus-within:shadow-[4px_4px_0_0_var(--pg-cyan)]">
        <Icon className="absolute left-3.5 size-4 text-white/40" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className="flex-1 bg-transparent py-3 pl-10 pr-4 text-sm font-medium text-white outline-none placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {rightElement && <div className="absolute right-3">{rightElement}</div>}
      </div>
    </div>
  );
}

function FeaturePill({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-lg border-[3px] border-black px-3 py-1 text-xs font-bold text-black"
      style={{ background: color }}
    >
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────
// Main Login Page
// ─────────────────────────────────────────────
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { admin, checking: checkingSession, login } = useAdminAuth();

  useEffect(() => {
    if (!checkingSession && admin) {
      router.replace("/admin/dashboard");
    }
  }, [admin, checkingSession, router]);

  // Focus email on mount
  useEffect(() => {
    if (!checkingSession) {
      document.getElementById("admin-email")?.focus();
    }
  }, [checkingSession]);

  const validate = () => {
    if (!email.trim()) {
      setError("Admin email is required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      setError("Password is required.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);
    const toastId = toast.loading("Authenticating…");

    try {
      await login(email.trim(), password);
      toast.success("Welcome back, Admin!", { id: toastId, duration: 2000 });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Invalid credentials. Please try again.";
      setError(msg);
      toast.error(msg, { id: toastId, duration: 4000 });
      setPassword(""); // Clear password on failure for security
    } finally {
      setLoading(false);
    }
  };

  // Show nothing while checking existing session
  if (checkingSession) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-[#0a0a0d] text-white">
        <div className="flex flex-col items-center gap-4">
          <div
            className="grid size-12 place-items-center rounded-2xl border-[3px] border-black text-black"
            style={{ background: A.lime }}
          >
            <Shield className="size-6" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm font-medium text-white/60">Checking session…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PlayScreen className="flex">
      {/* ─── Left panel: branding (hidden on mobile) ─── */}
      <div className="relative z-10 hidden w-[45%] flex-col justify-between px-14 py-12 lg:flex">
        <div className="flex items-center gap-3">
          <div
            className="grid size-10 place-items-center rounded-xl border-[3px] border-black text-black"
            style={{ background: A.lime }}
          >
            <Shield className="size-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-base font-extrabold leading-none text-white">VintiCode</p>
            <p className="mt-0.5 text-xs font-medium text-white/50">Admin Console</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-5">
            <span
              className="inline-flex -rotate-2 items-center gap-2 rounded-lg border-[3px] border-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black shadow-[3px_3px_0_0_#000]"
              style={{ background: A.cyan }}
            >
              Secure Admin Access
            </span>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tighter text-white">
              Control your
              <br />
              <span
                className="inline-block -rotate-1 rounded-xl border-[3px] border-black px-2 text-black"
                style={{ background: A.lime }}
              >
                platform
              </span>
              <br />
              with confidence.
            </h1>
            <p className="max-w-sm text-base font-medium leading-relaxed text-white/60">
              Manage users, questions, and submissions from a unified dashboard built for
              speed and clarity.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <FeaturePill text="JWT Auth" color={A.lime} />
            <FeaturePill text="Role-based Access" color={A.cyan} />
            <FeaturePill text="Real-time Stats" color={A.amber} />
            <FeaturePill text="Secure Sessions" color={A.coral} />
          </div>
        </div>

        <div className="border-l-[3px] border-white/20 pl-4">
          <p className="text-sm font-medium italic text-white/50">
            &quot;Access is a privilege. Manage responsibly.&quot;
          </p>
        </div>
      </div>

      {/* ─── Right panel: login form ─── */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <div
              className="mb-4 grid size-14 place-items-center rounded-2xl border-[3px] border-black text-black"
              style={{ background: A.lime }}
            >
              <Shield className="size-7" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-extrabold text-white">VintiCode Admin</h1>
            <p className="mt-1 text-sm font-medium text-white/50">Control Panel</p>
          </div>

          <PlayCard color={A.cyan} offset={10} className="p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-black tracking-tight text-white">Sign in to Admin</h2>
              <p className="mt-1 text-sm font-medium text-white/55">
                Enter your admin credentials to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <AdminInput
                id="admin-email"
                label="Admin Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="admin@vinticode.com"
                icon={Mail}
                autoComplete="email"
                disabled={loading}
              />

              <AdminInput
                id="admin-password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder="••••••••••"
                icon={Lock}
                autoComplete="current-password"
                disabled={loading}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-white/50 transition-colors hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              />

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border-[3px] border-black bg-[#0d0d11] px-4 py-3 text-sm font-semibold text-[var(--pg-coral)]"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <PlayButton
                id="admin-login-submit"
                type="submit"
                disabled={loading}
                aria-busy={loading}
                fill={A.lime}
                shadow={A.coral}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Authenticating…
                  </>
                ) : (
                  <>
                    Sign in to Admin Panel
                    <ArrowRight className="size-4" strokeWidth={3} />
                  </>
                )}
              </PlayButton>
            </form>

            <div className="mt-6 border-t-[3px] border-black pt-5">
              <div className="flex items-center gap-2 text-xs font-medium text-white/50">
                <Lock className="size-3" />
                <span>Protected by JWT · Session expires in 8 hours</span>
              </div>
            </div>
          </PlayCard>

          <p className="mt-6 text-center text-xs font-medium text-white/40">
            Unauthorized access attempts are logged and monitored.
          </p>
        </div>
      </div>
    </PlayScreen>
  );
}
