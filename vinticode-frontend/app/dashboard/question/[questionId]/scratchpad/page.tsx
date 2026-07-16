"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import ScratchPad from "@/components/scratchpad/ScratchPad";

export default function ScratchPadPage() {
  const { questionId } = useParams<{ questionId: string }>();
  const router = useRouter();

  const [notes, setNotes] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const resp = await api.get(`/dashboard/question/${questionId}`, {
          withCredentials: true,
        });
        setTitle(resp.data?.title ?? "");
        setDifficulty(resp.data?.difficulty ?? "");
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

  return (
    <ScratchPad
      title={title}
      difficulty={difficulty}
      notes={notes}
      onNotesChange={setNotes}
      onContinue={goToEditor}
      onSkip={goToEditor}
      onBack={() => router.push("/dashboard/home")}
      loading={loading}
    />
  );
}
