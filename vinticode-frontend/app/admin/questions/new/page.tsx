"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import adminApi from "@/lib/adminApi";
import QuestionForm, { QuestionFormData } from "../QuestionForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewQuestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data: QuestionFormData) => {
    setLoading(true);
    setError("");
    try {
      await adminApi.post("/questions", data);
      router.push("/admin/questions");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to create question.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/questions"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Questions
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">New Question</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fill in all fields below. Fields marked * are required.
        </p>
      </div>

      <QuestionForm
        onSubmit={handleSubmit}
        submitLabel="Create Question"
        loading={loading}
        error={error}
      />
    </div>
  );
}
