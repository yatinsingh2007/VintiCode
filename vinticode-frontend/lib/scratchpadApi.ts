import api from "./axios";

export type ReviewStatus = "READY" | "THINK_MORE";
export type ReviewState = "idle" | "loading" | "result" | "error";

export interface ApproachReviewResult {
  status: ReviewStatus;
  summary: string;
  suggestions: string[];
  scratchpadId: string;
}

export interface ReviewApproachPayload {
  questionId: string;
  questionTitle: string;
  questionDescription: string;
  approach: string;
}

export async function reviewApproach(
  payload: ReviewApproachPayload,
): Promise<ApproachReviewResult> {
  const resp = await api.post<ApproachReviewResult>(
    "/scratchpad/review",
    payload,
    { withCredentials: true },
  );
  return resp.data;
}
