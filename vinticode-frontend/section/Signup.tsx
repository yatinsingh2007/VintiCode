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
import { PasswordInput } from "@/components/ui/password-input";
import { Loader2 } from "lucide-react";
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

const MIN_PASSWORD_LENGTH = 8;

export default function SignupCard() {
  const [userDetails, setUserDetails] = useState<User>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  /*
    Mismatched passwords were only reported by a toast on submit. Deriving
    it lets us warn the moment the user has typed enough to be sure — a
    fix in place rather than a message that flies past the corner.
  */
  const mismatch =
    userDetails.confirmPassword.length > 0 &&
    userDetails.password !== userDetails.confirmPassword;
  const tooShort =
    userDetails.password.length > 0 &&
    userDetails.password.length < MIN_PASSWORD_LENGTH;

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (userDetails.password !== userDetails.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (userDetails.password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    try {
      const resp = await api.post("/auth/register", {
        name: userDetails.name,
        email: userDetails.email,
        password: userDetails.password,
      });
      if (resp.status !== 201) {
        setFormError("Signup failed. Please try again.");
        return;
      }
      toast.success("Account created. You can log in now.");
      setUserDetails({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      const message = isAxiosError(err)
        ? err.response?.data?.error ?? "Signup failed. Please try again."
        : "An unexpected error occurred. Please try again.";
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
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>Start building your DSA intuition today.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSignup} noValidate>
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
              <Label htmlFor="signup-name">Full name</Label>
              <Input
                id="signup-name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
                autoComplete="name"
                value={userDetails.name}
                onChange={(e) =>
                  setUserDetails({ ...userDetails, name: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                inputMode="email"
                placeholder="name@example.com"
                required
                autoComplete="email"
                value={userDetails.email}
                onChange={(e) =>
                  setUserDetails({ ...userDetails, email: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="signup-password">Password</Label>
              <PasswordInput
                id="signup-password"
                name="password"
                placeholder="At least 8 characters"
                required
                minLength={MIN_PASSWORD_LENGTH}
                autoComplete="new-password"
                aria-invalid={tooShort || undefined}
                aria-describedby="signup-password-hint"
                value={userDetails.password}
                onChange={(e) =>
                  setUserDetails({ ...userDetails, password: e.target.value })
                }
              />
              {/* Requirements stated up front rather than after a failure */}
              <p
                id="signup-password-hint"
                className={`text-xs ${tooShort ? "text-destructive-fg" : "text-muted-foreground"}`}
              >
                Use at least {MIN_PASSWORD_LENGTH} characters.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="signup-confirm">Confirm password</Label>
              <PasswordInput
                id="signup-confirm"
                name="confirmPassword"
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
                aria-invalid={mismatch || undefined}
                aria-describedby={mismatch ? "signup-confirm-error" : undefined}
                value={userDetails.confirmPassword}
                onChange={(e) =>
                  setUserDetails({
                    ...userDetails,
                    confirmPassword: e.target.value,
                  })
                }
              />
              {mismatch && (
                <p id="signup-confirm-error" className="text-xs text-destructive-fg">
                  Passwords don&apos;t match.
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <Button
            className="w-full"
            type="submit"
            disabled={loading || mismatch || tooShort}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
