import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { localSignup, googleLogin, googleSignupComplete } from "../../api/authApi";
import type { DJLevel } from "../../api/authApi";
import { authStore } from "../../store/authStore";
import Layout from "../../components/Layout";
import "./Auth.css";

const djLevels: DJLevel[] = ["beginner", "advanced", "expert"];

export default function SignupPage() {
  const nav = useNavigate();
  const location = useLocation();

  const [googleMode, setGoogleMode] = useState(false);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [djLevel, setDjLevel] = useState<DJLevel>("beginner");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.isGoogle) {
      setGoogleMode(true);
      if (location.state.email) setEmail(location.state.email);
      return;
    }
    const storedEmail = sessionStorage.getItem("pendingGoogleEmail");
    const storedMode = sessionStorage.getItem("pendingGoogleMode");

    if (storedMode === "true") {
      setGoogleMode(true);
      if (storedEmail) setEmail(storedEmail);
    }
  }, [location.state]);

  const pwOk = useMemo(
    () => password.length > 0 && password === passwordConfirm,
    [password, passwordConfirm]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (googleMode) {
      try {
        const res = await googleSignupComplete(
          { nickname, birthDate, djLevel, email: email || undefined },
        );

        sessionStorage.removeItem("pendingGoogleEmail");
        sessionStorage.removeItem("pendingGoogleMode");

        authStore.setAccessToken(res.accessToken);
        nav("/dj");
      } catch (err: any) {
        setErr(err?.response?.data?.error || "구글 회원가입 완료에 실패했습니다.");
      }
      return;
    }

    if (!pwOk) {
      setErr("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const res = await localSignup({ email, password, passwordConfirm, nickname, birthDate, djLevel });
      if (res.isNewUser) {
        setErr("프로필 상태가 올바르지 않습니다. 다시 시도해주세요.");
        return;
      }
      authStore.setAccessToken(res.accessToken);
      nav("/dj"); // existing was /tutorial
    } catch {
      setErr("회원가입에 실패했습니다. 입력값을 확인해주세요.");
    }
  }

  return (
    <Layout>
      <div className="auth-card">
        <h2 className="auth-title">Sign up</h2>

        {/* Google Login for pure Signup (not finishing flow) */}
        {!googleMode && (
          <div className="google-btn-wrapper" style={{ marginBottom: '20px' }}>
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
              Sign up with Google
            </div>
            <div className="google-btn-hidden">
              <GoogleLogin
                useOneTap={false}
                theme="outline"
                shape="rectangular"
                width="600"
                onSuccess={async (credRes) => {
                  // ... same logic ...
                  try {
                    const credential = credRes.credential;
                    if (!credential) throw new Error("no credential");
                    const res = await googleLogin({ credential });
                    if (res.isNewUser) {
                      if (res.signupToken) authStore.setSignupToken(res.signupToken);
                      setGoogleMode(true);
                      if (res.email) setEmail(res.email);
                      setErr(null);
                      return;
                    }
                    authStore.setAccessToken(res.accessToken);
                    nav("/dj");
                  } catch (err: any) {
                    setErr(err?.response?.data?.error || "구글 로그인 실패");
                  }
                }}
                onError={() => setErr("구글 로그인 실패")}
              />
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email"
              disabled={googleMode}
              style={googleMode ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
            />
          </div>

          {!googleMode && (
            <>
              <div className="input-group">
                <label className="input-label">Password</label>
                <input
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Password"
                  type="password"
                />
              </div>
              <div className="input-group tight">
                <input
                  className="auth-input"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Enter your Password again"
                  type="password"
                />
              </div>
            </>
          )}

          <div className="input-group">
            <label className="input-label">DJ name</label>
            <input
              className="auth-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Birthday</label>
            <input
              className="auth-input"
              value={birthDate}
              onChange={(e) => {
                let v = e.target.value.replace(/[^0-9]/g, "");
                if (v.length >= 5) v = v.slice(0,4) + "-" + v.slice(4);
                if (v.length >= 8) v = v.slice(0,7) + "-" + v.slice(7,9);
                setBirthDate(v.slice(0, 10));
              }}
              type="text"
              placeholder="YYYY-MM-DD"
              inputMode="numeric"
              pattern="\d{4}-\d{2}-\d{2}"
            />
          </div>
          <div className="input-group">
            <label className="input-label">DJ Level</label>
            <div className="level-selector">
              {djLevels.map((v) => (
                <label key={v} className="level-option">
                  <input
                    type="radio"
                    name="djLevel"
                    value={v}
                    checked={djLevel === v}
                    onChange={(e) => setDjLevel(e.target.value as DJLevel)}
                  />
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {!googleMode && !pwOk && passwordConfirm.length > 0 && (
            <div style={{ color: "#ff6b6b", fontSize: "12px" }}>비밀번호가 일치하지 않습니다.</div>
          )}
          {err && <div style={{ color: "#ff6b6b", fontSize: "14px" }}>{err}</div>}

          <button type="submit" className="auth-btn-primary">
            Sign up
          </button>
        </form>
      </div>
    </Layout>
  );
}