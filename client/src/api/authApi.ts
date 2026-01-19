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

export type AuthTokenResponse = {
  accessToken: string;
  isNewUser: boolean;
};

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

export async function googleLogin(req: { credential: string }) {
  const { data } = await api.post<AuthTokenResponse>("/auth/login/google", req);
  return data;
}

export async function googleSignupComplete(body: CompleteMyProfileRequest) {
  const res = await api.post<void>("/auth/profile/complete", body);
  return res.data;
}