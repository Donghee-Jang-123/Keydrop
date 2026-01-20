import axios from "axios";
import { authStore } from "../store/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type AuthTokenResponse =
  | { isNewUser: false; accessToken: string }
  | { isNewUser: true; signupToken: string; email?: string };

export type DJLevel = "beginner" | "advanced" | "expert";

export type LocalSignupRequest = {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  birthDate: string;
  djLevel: DJLevel;
};

export type LocalLoginRequest = {
  email: string;
  password: string;
};

export type CompleteMyProfileRequest = {
  email?: string;
  nickname: string;
  birthDate: string;
  djLevel: DJLevel;
};

export async function localSignup(req: LocalSignupRequest) {
  const { data } = await api.post<AuthTokenResponse>("/auth/signup", req);
  return data;
}

export async function localLogin(req: LocalLoginRequest) {
  const { data } = await api.post<AuthTokenResponse>("/auth/login", req);
  return data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch {
  } finally {
    authStore.clear();
  }
}

export async function googleLogin(req: { credential: string }) {
  const { data } = await api.post<AuthTokenResponse>("/auth/login/google", req);
  return data;
}

export async function googleSignupComplete(body: CompleteMyProfileRequest) {
  const { data } = await api.post<{ accessToken: string }>("/auth/profile/complete", body);
  return data;
}