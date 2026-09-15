"use client";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";
import { PlayButton, PlayInput, PlayLabel, A } from "@/components/playground";

interface Credentials {
  name: string;
  email: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const [details, setDetails] = useState<Credentials>({
    name: "",
    email: "",
    password: "",
  });
  const [passwordType, setPasswordType] =
    useState<"password" | "text">("password");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: details.email,
        password: details.password,
      });
      if (res.status !== 200) {
        return toast.error("Login failed");
      }
      toast.success("Logged in successfully!");
      router.push("/dashboard/home");
      toast.dismiss();
      setDetails({ name: "", email: "", password: "" });
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        return toast.error(err.response?.data?.error || "Login failed");
      }
      return toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight">Welcome back</h2>
        <p className="mt-1 text-sm font-medium text-white/60">
          Enter your credentials to jump back in.
        </p>
      </div>

      <form onSubmit={handleLogin} className="grid gap-4">
        <div className="grid gap-2">
          <PlayLabel htmlFor="email">Email</PlayLabel>
          <PlayInput
            id="email"
            type="email"
            placeholder="name@example.com"
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <PlayLabel htmlFor="password">Password</PlayLabel>
          <div className="relative">
            <PlayInput
              id="password"
              type={passwordType}
              placeholder="*********"
              className="pr-11"
              value={details.password}
              onChange={(e) =>
                setDetails({ ...details, password: e.target.value })
              }
            />
            <button
              type="button"
              aria-label={passwordType === "password" ? "Show password" : "Hide password"}
              onClick={() =>
                setPasswordType(passwordType === "password" ? "text" : "password")
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white"
            >
              {passwordType === "password" ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
        </div>

        <PlayButton
          type="submit"
          disabled={loading}
          fill={A.lime}
          shadow={A.coral}
          className="mt-2 w-full"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Signing In...
            </>
          ) : (
            <>
              Sign In <ArrowRight strokeWidth={3} className="size-4" />
            </>
          )}
        </PlayButton>
      </form>
    </div>
  );
}
