"use client";

import { EyeOff, Eye, Loader2, ArrowRight } from "lucide-react";
import React, { useState } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import { PlayButton, PlayInput, PlayLabel, A } from "@/components/playground";

interface User {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupCard() {
  const [userDetails, setUserDetails] = useState<User>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordType, setPasswordType] =
    useState<"password" | "text">("password");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (userDetails.password !== userDetails.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    try {
      const resp = await api.post("/auth/register", {
        name: userDetails.name,
        email: userDetails.email,
        password: userDetails.password,
      });
      if (resp.status !== 201) {
        return toast.error("Signup failed");
      }
      toast.success("Account created successfully! Please login.");
      setUserDetails({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      if (isAxiosError(err)) {
        return toast.error(err.response?.data?.error || "Signup failed");
      }
      return toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight">Create your account</h2>
        <p className="mt-1 text-sm font-medium text-white/60">
          Start building real intuition today.
        </p>
      </div>

      <form onSubmit={handleSignup} className="grid gap-4">
        {/* Full Name */}
        <div className="grid gap-2">
          <PlayLabel htmlFor="fullname">Full Name</PlayLabel>
          <PlayInput
            id="fullname"
            type="text"
            placeholder="John Doe"
            required
            value={userDetails.name}
            onChange={(e) =>
              setUserDetails({ ...userDetails, name: e.target.value })
            }
          />
        </div>

        {/* Email */}
        <div className="grid gap-2">
          <PlayLabel htmlFor="email">Email</PlayLabel>
          <PlayInput
            id="email"
            type="email"
            placeholder="name@example.com"
            required
            value={userDetails.email}
            onChange={(e) =>
              setUserDetails({ ...userDetails, email: e.target.value })
            }
          />
        </div>

        {/* Password */}
        <div className="grid gap-2">
          <PlayLabel htmlFor="password">Password</PlayLabel>
          <div className="relative">
            <PlayInput
              id="password"
              type={passwordType}
              placeholder="********"
              required
              className="pr-11"
              value={userDetails.password}
              onChange={(e) =>
                setUserDetails({ ...userDetails, password: e.target.value })
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

        {/* Confirm Password */}
        <div className="grid gap-2">
          <PlayLabel htmlFor="confirmPassword">Confirm Password</PlayLabel>
          <div className="relative">
            <PlayInput
              id="confirmPassword"
              type={passwordType}
              placeholder="********"
              required
              className="pr-11"
              value={userDetails.confirmPassword}
              onChange={(e) =>
                setUserDetails({
                  ...userDetails,
                  confirmPassword: e.target.value,
                })
              }
            />
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
              Creating Account...
            </>
          ) : (
            <>
              Create Account <ArrowRight strokeWidth={3} className="size-4" />
            </>
          )}
        </PlayButton>
      </form>
    </div>
  );
}
