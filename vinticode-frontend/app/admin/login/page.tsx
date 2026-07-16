"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import adminApi from "@/lib/adminApi";
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

// ─────────────────────────────────────────────
// Animated grid background
// ─────────────────────────────────────────────
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />

      {/* Grid lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="admin-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="white"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#admin-grid)" />
      </svg>

      {/* Floating orbs */}
      <div
        className="absolute top-[15%] left-[10%] w-2 h-2 rounded-full bg-primary/20"
        style={{ animation: "float1 6s ease-in-out infinite" }}
      />
      <div
        className="absolute top-[60%] left-[85%] w-1.5 h-1.5 rounded-full bg-muted-foreground/20"
        style={{ animation: "float2 8s ease-in-out infinite" }}
      />
      <div
        className="absolute top-[80%] left-[20%] w-1 h-1 rounded-full bg-primary/10"
        style={{ animation: "float1 10s ease-in-out infinite 2s" }}
      />
    </div>
  );
}

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
  const [focused, setFocused] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-foreground mb-2"
      >
        {label}
      </label>
      <div
        className={`
          relative flex items-center rounded-xl border transition-all duration-200
          ${focused
            ? "border-border-strong ring-2 ring-ring/50 bg-background"
            : "border-border bg-background hover:border-border-strong"
          }
        `}
      >
        <Icon
          className={`absolute left-3.5 w-4 h-4 transition-colors duration-200 ${
            focused ? "text-foreground" : "text-muted-foreground"
          }`}
        />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`
            flex-1 bg-transparent text-foreground placeholder:text-muted-foreground
            pl-10 pr-4 py-3 text-sm outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
        {rightElement && (
          <div className="absolute right-3">{rightElement}</div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Feature badge
// ─────────────────────────────────────────────
function FeaturePill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/5 text-muted-foreground border border-border">
      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
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
  const [checkingSession, setCheckingSession] = useState(true);
  const emailRef = useRef<HTMLInputElement | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    adminApi
      .get("/verify")
      .then(() => router.replace("/admin/dashboard"))
      .catch(() => {})
      .finally(() => setCheckingSession(false));
  }, [router]);

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
    const toastId = toast.loading("Authenticating…", {
      style: {
        background: "#161b22",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.08)",
      },
    });

    try {
      await adminApi.post("/login", { email: email.trim(), password });
      toast.success("Welcome back, Admin!", {
        id: toastId,
        duration: 2000,
        style: {
          background: "#161b22",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.2)",
        },
        iconTheme: { primary: "#fff", secondary: "#000" },
      });
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Invalid credentials. Please try again.";
      setError(msg);
      toast.error(msg, {
        id: toastId,
        duration: 4000,
        style: {
          background: "#161b22",
          color: "#fff",
          border: "1px solid rgba(239,68,68,0.3)",
        },
        iconTheme: { primary: "#ef4444", secondary: "#fff" },
      });
      setPassword(""); // Clear password on failure for security
    } finally {
      setLoading(false);
    }
  };

  // Show nothing while checking existing session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-foreground" />
            <span className="text-muted-foreground text-sm">
              Checking session…
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global keyframe styles for floating orbs */}
      <style jsx global>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-15px) translateX(10px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>

      <div className="min-h-screen bg-background flex relative">
        <GridBackground />

        {/* ─── Left panel: branding (hidden on mobile) ─── */}
        <div className="hidden lg:flex flex-col justify-between w-[45%] px-14 py-12 relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg ">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-foreground font-bold text-base leading-none">
                VintiCode
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">Admin Console</p>
            </div>
          </div>

          {/* Hero copy */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-foreground text-xs font-medium">
                  Secure Admin Access
                </span>
              </div>
              <h1 className="text-4xl font-bold text-foreground leading-tight">
                Control your
                <br />
                <span className="bg-primary bg-clip-text text-transparent">
                  platform with
                </span>
                <br />
                confidence.
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
                Manage users, questions, and submissions from a unified
                dashboard built for speed and clarity.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <FeaturePill text="JWT Authentication" />
              <FeaturePill text="Role-based Access" />
              <FeaturePill text="Real-time Stats" />
              <FeaturePill text="Secure Sessions" />
            </div>
          </div>

          {/* Bottom quote */}
          <div className="border-l-2 border-border-strong pl-4">
            <p className="text-muted-foreground text-sm italic">
              &quot;Access is a privilege. Manage responsibly.&quot;
            </p>
          </div>
        </div>

        {/* ─── Right panel: login form ─── */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
          <div
            className="w-full max-w-md animate-slide-up"
            style={{ animationDelay: "0.1s", opacity: 0 }}
          >
            {/* Mobile logo */}
            <div className="flex flex-col items-center mb-8 lg:hidden">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg  mb-4">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="text-foreground text-xl font-bold">VintiCode Admin</h1>
              <p className="text-muted-foreground text-sm mt-1">Control Panel</p>
            </div>

            {/* Card */}
            <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl ">
              {/* Card header */}
              <div className="mb-8">
                <div className="hidden lg:block">
                  <h2 className="text-foreground text-2xl font-bold">
                    Sign in to Admin
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Enter your admin credentials to continue
                  </p>
                </div>
                <div className="lg:hidden text-center">
                  <h2 className="text-foreground text-xl font-bold">Admin Sign In</h2>
                </div>
              </div>

              {/* Form */}
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
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 bg-destructive-subtle border border-destructive/20 text-destructive-fg text-sm rounded-xl px-4 py-3 animate-fade-in"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  id="admin-login-submit"
                  type="submit"
                  disabled={loading}
                  className={`
                    relative w-full group overflow-hidden
                    bg-primary hover:bg-primary-hover
                    text-primary-foreground font-semibold py-3 rounded-xl text-sm
                    transition-all duration-300
                    disabled:opacity-60 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                    shadow-lg 
                    focus:outline-none focus:ring-2 focus:ring-ring/50
                  `}
                >
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-border to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />

                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating…
                    </>
                  ) : (
                    <>
                      Sign in to Admin Panel
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Security notice */}
              <div className="mt-6 pt-5 border-t border-border">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Lock className="w-3 h-3" />
                  <span>
                    Protected by JWT · Session expires in 8 hours
                  </span>
                </div>
              </div>
            </div>

            <p className="text-center text-muted-foreground text-xs mt-6">
              Unauthorized access attempts are logged and monitored.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
