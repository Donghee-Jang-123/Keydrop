import { api } from "../common/apiClient";

export type AuthTokenResponse = {
  accessToken: string;
  isNewUser: boolean;
};

export type DJLevel = "beginner" | "advanced" | "expert";
export type Purpose = "Practice" | "Mixing" | "Performance" | "Monitoring" | "Curation";

export type LocalSignupRequest = {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  birthDate: string; // YYYY-MM-DD
  djLevel: DJLevel;
};

export type LocalLoginRequest = {
  username: string;
  password: string;
};

export async function localSignup(req: LocalSignupRequest) {
  const { data } = await api.post<AuthTokenResponse>("/auth/signup", req);
  return data;
}

export async function localLogin(req: LocalLoginRequest) {
  const { data } = await api.post<AuthTokenResponse>("/auth/login", req);
  return data;
}