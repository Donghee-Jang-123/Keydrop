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
            authStore.setToken(res.accessToken);

            if (res.isNewUser) nav("/signup"); // 추가정보 받는 회원가입 페이지
            else nav("/dj");
          } catch {
            alert("구글 로그인 실패");
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
      </form>

      <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
        <button type="button" onClick={() => nav("/signup")}>회원가입</button>
        <button type="button" onClick={() => alert("아이디/비밀번호 찾기는 다음 단계")}>
          아이디/비밀번호 찾기
        </button>
      </div>
    </div>
  );
}