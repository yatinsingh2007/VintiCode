import api from "./axios";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyResponse {
  authenticated: boolean;
}

// POST /api/auth/register
export async function register(payload: RegisterPayload): Promise<string> {
  const resp = await api.post<string>("/auth/register", payload);
  return resp.data;
}

// POST /api/auth/login
export async function login(payload: LoginPayload): Promise<{ message: string }> {
  const resp = await api.post<{ message: string }>("/auth/login", payload);
  return resp.data;
}

// GET /api/auth/logout
export async function logout(): Promise<{ message: string }> {
  const resp = await api.get<{ message: string }>("/auth/logout");
  return resp.data;
}

// GET /api/auth/verify
export async function verify(): Promise<VerifyResponse> {
  const resp = await api.get<VerifyResponse>("/auth/verify");
  return resp.data;
}
