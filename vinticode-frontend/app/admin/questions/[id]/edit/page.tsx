"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import adminApi from "@/lib/adminApi";
import QuestionForm, { QuestionFormData } from "../../QuestionForm";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [initialData, setInitialData] = useState<QuestionFormData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    adminApi
      .get(`/questions/${id}`)
      .then((res) => setInitialData(res.data))
      .catch(() => setError("Question not found."))
      .finally(() => setFetchLoading(false));
  }, [id]);

  const handleSubmit = async (data: QuestionFormData) => {
    setLoading(true);
    setError("");
    try {
      await adminApi.put(`/questions/${id}`, data);
      router.push("/admin/questions");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to update question.";
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
          className="flex w-fit items-center gap-1.5 text-sm font-bold text-white/60 transition-colors hover:text-white"
        >
          <ChevronLeft className="size-4" strokeWidth={2.5} />
          Back to Questions
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-black tracking-tighter text-white">Edit Question</h1>
        <p className="mt-1 text-sm font-medium text-white/55">
          Update the question details and test cases below.
        </p>
      </div>

      {fetchLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-white" />
        </div>
      ) : initialData ? (
        <QuestionForm
          initialData={initialData}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          loading={loading}
          error={error}
        />
      ) : (
        <div
          className="rounded-2xl border-[3px] border-black bg-[#141419] px-5 py-4 text-sm font-semibold text-[var(--pg-coral)]"
          style={{ boxShadow: "6px 6px 0 0 var(--pg-coral)" }}
        >
          {error || "Could not load question."}
        </div>
      )}
    </div>
  );
}
