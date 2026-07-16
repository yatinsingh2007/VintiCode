"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShineBorder } from "@/components/magicui/shine-border";
import { EyeOff, Eye, Loader2 } from "lucide-react";
import React, { useState } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";

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
    <Card
      className="relative overflow-hidden max-w-[350px] w-full border-2 border-black bg-black text-white"
      style={{ width: "60vw" }}
    >
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />

      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription className="text-gray-200">
          Create a new account to get started
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSignup}>
        <CardContent>
          <div className="grid gap-4">
            {/* Full Name */}
            <div className="grid gap-2">
              <Label htmlFor="fullname">Full Name</Label>
              <Input
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
              <Label htmlFor="email">Email</Label>
              <Input
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
            <div className="grid gap-2 relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={passwordType}
                placeholder="********"
                required
                value={userDetails.password}
                onChange={(e) =>
                  setUserDetails({ ...userDetails, password: e.target.value })
                }
              />
              {passwordType === "password" ? (
                <EyeOff
                  className="absolute right-3 top-7 cursor-pointer"
                  onClick={() => setPasswordType("text")}
                />
              ) : (
                <Eye
                  className="absolute right-3 top-7 cursor-pointer"
                  onClick={() => setPasswordType("password")}
                />
              )}
            </div>

            {/* Confirm Password */}
            <div className="grid gap-2 relative">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={passwordType}
                placeholder="********"
                required
                value={userDetails.confirmPassword}
                onChange={(e) =>
                  setUserDetails({
                    ...userDetails,
                    confirmPassword: e.target.value,
                  })
                }
              />
              {passwordType === "password" ? (
                <EyeOff
                  className="absolute right-3 top-7 cursor-pointer"
                  onClick={() => setPasswordType("text")}
                />
              ) : (
                <Eye
                  className="absolute right-3 top-7 cursor-pointer"
                  onClick={() => setPasswordType("password")}
                />
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-white text-black hover:bg-white hover:text-black hover:scale-105 cursor-pointer mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
