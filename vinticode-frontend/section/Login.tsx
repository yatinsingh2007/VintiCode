"use client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
import { PasswordInput } from "@/components/ui/password-input";
import { useState } from "react";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Credentials {
  email: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const [details, setDetails] = useState<Credentials>({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    try {
      const res = await api.post("/auth/login", {
        email: details.email,
        password: details.password,
      });
      if (res.status !== 200) {
        setFormError("Login failed. Please try again.");
        return;
      }
      toast.success("Welcome back!");
      router.push("/dashboard/home");
      setDetails({ email: "", password: "" });
    } catch (err) {
      console.error(err);
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? "Incorrect email or password."
        : "An unexpected error occurred. Please try again.";
      // Errors were toast-only: they appeared away from the form and
      // vanished after a few seconds, leaving the user staring at a form
      // with no indication of what went wrong. Now shown inline and kept.
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Chrome comes from the auth panel that hosts this form; the card here
    // is only a layout container, so its border/padding are neutralised.
    <Card className="w-full gap-5 border-0 bg-transparent py-0 shadow-none [&>*]:px-0">
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleLogin} noValidate>
        <CardContent>
          <div className="grid gap-4">
            {formError && (
              <p
                role="alert"
                className="rounded-md border border-destructive/20 bg-destructive-subtle px-3 py-2 text-sm text-destructive-fg"
              >
                {formError}
              </p>
            )}

            <div className="grid gap-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                inputMode="email"
                placeholder="name@example.com"
                required
                // Lets password managers recognise and fill the form.
                autoComplete="email"
                aria-invalid={formError ? true : undefined}
                value={details.email}
                onChange={(e) => setDetails({ ...details, email: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="login-password">Password</Label>
              <PasswordInput
                id="login-password"
                name="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                aria-invalid={formError ? true : undefined}
                value={details.password}
                onChange={(e) => setDetails({ ...details, password: e.target.value })}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <Button className="w-full" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
