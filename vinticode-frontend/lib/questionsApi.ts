import api from "./axios";

// ── Shared types ────────────────────────────────────────────────────────────

export interface RunCodePayload {
  code: string;
  language_id: number;
  input: string;
}

export interface SubmitCodePayload {
  code: string;
  language_id: number;
}

export interface ExecutionResult {
  status: string;
  stdout: string;
  stderr: string | null;
  time: string | null;
  memory: number | null;
}

export interface RunResultResponse {
  status: "processing" | "completed" | "failed";
  result?: ExecutionResult;
}

export interface SubmissionResultResponse {
  status: "queued" | "processing" | "completed" | "failed";
  report?: {
    passed: number;
    total: number;
    results: {
      passed: boolean;
      stdout: string;
      expected: string;
      stderr: string | null;
      time: string | null;
      memory: number | null;
    }[];
  };
}

export interface Submission {
  id: string;
  userId: string;
  questionId: string;
  languageId: number;
  scratchpadId: string | null;
  code: string;
  status: "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

// POST /api/questions/runCode/:id
export async function runCode(
  questionId: string,
  payload: RunCodePayload,
): Promise<{ submissionId: string }> {
  const resp = await api.post<{ submissionId: string }>(
    `/questions/runCode/${questionId}`,
    payload,
  );
  return resp.data;
}

// GET /api/questions/runCode/result/:submissionId
export async function getRunResult(
  submissionId: string,
): Promise<RunResultResponse> {
  const resp = await api.get<RunResultResponse>(
    `/questions/runCode/result/${submissionId}`,
  );
  return resp.data;
}

// POST /api/questions/submitCode/:id
export async function submitCode(
  questionId: string,
  payload: SubmitCodePayload,
): Promise<{ submissionId: string; status: string }> {
  const resp = await api.post<{ submissionId: string; status: string }>(
    `/questions/submitCode/${questionId}`,
    payload,
  );
  return resp.data;
}

// GET /api/questions/submission/result/:submissionId
export async function getSubmissionResult(
  submissionId: string,
): Promise<SubmissionResultResponse> {
  const resp = await api.get<SubmissionResultResponse>(
    `/questions/submission/result/${submissionId}`,
  );
  return resp.data;
}

// GET /api/questions/submissions/:id  (all submissions for a question by the current user)
export async function getSubmissionsByQuestion(
  questionId: string,
): Promise<{ submissions: Submission[] }> {
  const resp = await api.get<{ submissions: Submission[] }>(
    `/questions/submissions/${questionId}`,
  );
  return resp.data;
}

// GET /api/questions/submission/:id  (single submission by its own id)
export async function getSubmissionById(
  submissionId: string,
): Promise<Submission> {
  const resp = await api.get<Submission>(
    `/questions/submission/${submissionId}`,
  );
  return resp.data;
}

// GET /api/questions/latestSubmission/:id
export async function getLatestSubmission(
  questionId: string,
): Promise<Submission> {
  const resp = await api.get<Submission>(
    `/questions/latestSubmission/${questionId}`,
  );
  return resp.data;
}
