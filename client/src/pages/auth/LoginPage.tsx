import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { localLogin, googleLogin } from "../../api/authApi";
import { GoogleLogin } from "@react-oauth/google";
import { authStore } from "../../store/authStore";

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
          authStore.setToken(res.signupToken);
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
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <h2>Login</h2>

      <GoogleLogin
        onSuccess={async (credRes) => {
          try {
            const credential = credRes.credential;
            if (!credential) throw new Error("No credential");

            const res = await googleLogin({ credential });

            if (res.isNewUser) {
              // signupToken 저장 (프로필 완성을 위해 필요) -> authStore 금지(Routing 리다이렉트 방지)
              if (res.signupToken) {
                sessionStorage.setItem("pendingSignupToken", res.signupToken);
              }
              // 이메일 정보와 함께 이동 (state + sessionStorage 백업)
              if (res.email) {
                sessionStorage.setItem("pendingGoogleEmail", res.email);
              }
              sessionStorage.setItem("pendingGoogleMode", "true");

              console.log("Navigating to signup with:", { isGoogle: true, email: res.email });
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
      />

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        {err && <div style={{ color: "crimson" }}>{err}</div>}
        <button type="submit" style={{ padding: 12 }}>
          로그인
        </button>
        <button type="button" onClick={() => nav("/signup")}>
          회원가입
        </button>
      </form>
    </div>
  );
}