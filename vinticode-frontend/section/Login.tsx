"use client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShineBorder } from "@/components/magicui/shine-border";
import { useState } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";

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
    <Card className="relative overflow-hidden max-w-[400px] w-full border-2 border-black bg-black text-white" style={{ width: "60vw" }}>
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription className="text-gray-200">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={details.email}
                onChange={(e) =>
                  setDetails({ ...details, email: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={passwordType}
                placeholder="*********"
                value={details.password}
                onChange={(e) =>
                  setDetails({ ...details, password: e.target.value })
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
            className="w-full bg-white text-black hover:scale-105 hover:bg-white hover:text-black cursor-pointer mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
