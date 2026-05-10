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
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Questions
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Edit Question</h1>
        <p className="text-gray-400 text-sm mt-1">
          Update the question details and test cases below.
        </p>
      </div>

      {fetchLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
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
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-5 py-4 text-sm">
          {error || "Could not load question."}
        </div>
      )}
    </div>
  );
}
