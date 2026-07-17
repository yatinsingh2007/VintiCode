import api from "./axios";

export interface Question {
  id: string;
  title: string;
  description: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  test_cases: unknown;
  difficulty: "Easy" | "Medium" | "Hard";
  createdAt: string;
  updatedAt: string;
}

export interface QuestionListItem extends Question {
  done: boolean;
}

// GET /api/dashboard/home
export async function getHome(): Promise<QuestionListItem[]> {
  const resp = await api.get<QuestionListItem[]>("/dashboard/home");
  return resp.data;
}

// GET /api/dashboard/question/:id
export async function getQuestionById(id: string): Promise<Question> {
  const resp = await api.get<Question>(`/dashboard/question/${id}`);
  return resp.data;
}
