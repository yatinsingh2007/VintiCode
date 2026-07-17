import api from "./axios";
import type { Submission } from "./questionsApi";
import type { Question } from "./dashboardApi";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SubmissionWithQuestion extends Submission {
  question: Question;
}

export interface DifficultyTotal {
  difficulty: string;
  total_count: number;
}

export type SolvedByDifficulty = Record<string, number>;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

// GET /api/userprofile/submissions
export async function getSubmissions(): Promise<SubmissionWithQuestion[]> {
  const resp = await api.get<SubmissionWithQuestion[]>(
    "/userprofile/submissions",
  );
  return resp.data;
}

// GET /api/userprofile/count-of-submittedQuestions
// Returns [totalPerDifficulty..., solvedPerDifficulty]
export async function getSubmissionCounts(): Promise<
  [...DifficultyTotal[], SolvedByDifficulty]
> {
  const resp = await api.get<[...DifficultyTotal[], SolvedByDifficulty]>(
    "/userprofile/count-of-submittedQuestions",
  );
  return resp.data;
}

// GET /api/userprofile/
export async function getUserProfile(): Promise<UserProfile> {
  const resp = await api.get<UserProfile>("/userprofile/");
  return resp.data;
}
