import axios from "axios";
import { authStore } from "../store/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = authStore.getToken();
  if (token) {
    config.headers = config.headers ?? {};
    // axios v1: headers can be AxiosHeaders; plain object assignment is OK here
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const msg: string | undefined = err?.response?.data?.error;

    // 토큰 만료/유효하지 않음이면 자동 정리 (다음 화면에서 재로그인 유도)
    if (
      status === 401 ||
      status === 403 ||
      (typeof msg === "string" && (msg.includes("인증 토큰") || msg.includes("Invalid token type") || msg.includes("Authorization is required")))
    ) {
      authStore.clear();
    }
    return Promise.reject(err);
  }
);

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

export async function googleSignupComplete(
  body: CompleteMyProfileRequest,
  opts?: { signupToken?: string }
) {
  const headers = opts?.signupToken ? { Authorization: `Bearer ${opts.signupToken}` } : undefined;
  const { data } = await api.post<{ accessToken: string }>("/auth/profile/complete", body, { headers });
  return data;
}