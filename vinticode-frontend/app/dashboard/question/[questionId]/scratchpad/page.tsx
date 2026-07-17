"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import ScratchPad from "@/components/scratchpad/ScratchPad";
import { reviewApproach } from "@/lib/scratchpadApi";
import type { ApproachReviewResult, ReviewState } from "@/lib/scratchpadApi";

export default function ScratchPadPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const router = useRouter();

  const [notes, setNotes] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const [reviewState, setReviewState] = useState<ReviewState>("idle");
  const [reviewResult, setReviewResult] = useState<ApproachReviewResult | null>(null);
  const [reviewError, setReviewError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get(`/dashboard/question/${questionId}`, {
          withCredentials: true,
        });
        setTitle(resp.data?.title ?? "");
        setDifficulty(resp.data?.difficulty ?? "");
        setDescription(resp.data?.description ?? "");
      } catch (err) {
        console.error(err);
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.push("/auth");
          return;
        }
        toast.error("Failed to load question. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, [questionId, router]);

  const goToEditor = () => router.push(`/dashboard/question/${questionId}`);

  const handleReview = async () => {
    if (!notes.trim()) {
      toast.error("Write something in the scratch pad before reviewing.");
      return;
    }

    setReviewState("loading");
    setReviewResult(null);
    setReviewError("");

    try {
      const result = await reviewApproach({
        questionId,
        questionTitle: title,
        questionDescription: description,
        approach: notes,
      });
      setReviewResult(result);
      setReviewState("result");
    } catch (err) {
      console.error(err);
      let message = "Failed to analyze your approach. Please try again.";
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          router.push("/auth");
          return;
        }
        message = err.response?.data?.error ?? message;
      }
      setReviewError(message);
      setReviewState("error");
    }
  };

  const handleDismissReview = () => {
    setReviewState("idle");
    setReviewResult(null);
    setReviewError("");
  };

  return (
    <ScratchPad
      title={title}
      difficulty={difficulty}
      notes={notes}
      onNotesChange={(val) => {
        setNotes(val);
        if (reviewState !== "idle") handleDismissReview();
      }}
      onContinue={goToEditor}
      onSkip={goToEditor}
      onBack={() => router.push("/dashboard/home")}
      loading={loading}
      onReview={handleReview}
      reviewState={reviewState}
      reviewResult={reviewResult}
      reviewError={reviewError}
      onDismissReview={handleDismissReview}
    />
  );
}
