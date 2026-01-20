import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { localLogin, googleLogin } from "../../api/authApi";
import { GoogleLogin } from "@react-oauth/google";
import { authStore } from "../../store/authStore";
import Layout from "../../components/Layout";
import "./Auth.css";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    try {
      const res = await localLogin({ email, password });

      if (res.isNewUser) {
        if (res.signupToken) {
          // signupToken은 access token이 아니라서 (이후 /api/* 요청에서 깨질 수 있음)
          // sessionStorage에만 보관하고, 프로필 완료 흐름에서만 사용
          sessionStorage.setItem("pendingSignupToken", res.signupToken);
        }
        nav("/signup", { state: { isGoogle: true, email: res.email } });
        return;
      }

      authStore.setToken(res.accessToken);
      nav("/dj");
    } catch {
      setErr("아이디/비밀번호가 일치하지 않습니다.");
    }
  }

  return (
    <Layout>
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="input-group">
            <input
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email"
            />
          </div>
          <div className="input-group tight">
            <input
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your Password"
              type="password"
            />
          </div>

          {err && <div style={{ color: "#ff6b6b", fontSize: "14px" }}>{err}</div>}

          {/* Custom Google Button Layout if possible, or just wrapper */}
          {/* Custom Google Button Layout with Overlay */}
          <div className="google-btn-wrapper">
            <div className="google-btn-fake">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </div>
            <div className="google-btn-hidden">
              <GoogleLogin
                onSuccess={async (credRes) => {
                  try {
                    const credential = credRes.credential;
                    if (!credential) throw new Error("No credential");

                    const res = await googleLogin({ credential });

                    if (res.isNewUser) {
                      if (res.signupToken) {
                        sessionStorage.setItem("pendingSignupToken", res.signupToken);
                      }
                      if (res.email) {
                        sessionStorage.setItem("pendingGoogleEmail", res.email);
                      }
                      sessionStorage.setItem("pendingGoogleMode", "true");

                      nav("/signup", { state: { isGoogle: true, email: res.email } });
                      return;
                    }

                    authStore.setToken(res.accessToken);
                    nav("/dj");
                  } catch (err: any) {
                    const msg = err?.response?.data?.error || "구글 로그인 실패";
                    alert(msg);
                  }
                }}
                onError={() => alert("구글 로그인 실패")}
                useOneTap={false}
                theme="outline"
                shape="rectangular"
                width="600"
              />
            </div>
          </div>

          <div className="auth-btn-group">
            <button type="submit" className="auth-btn-primary">
              Login
            </button>
            <button
              type="button"
              className="auth-btn-secondary"
              onClick={() => nav("/signup")}
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}