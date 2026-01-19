import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { localLogin } from "../../api/authApi";
import { authStore } from "../../store/authStore";

export default function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const res = await localLogin({ username, password });
      authStore.setToken(res.accessToken);
      nav("/dj");
    } catch {
      setErr("아이디/비밀번호가 일치하지 않습니다.");
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <h2>Login</h2>

      <button
        type="button"
        onClick={() => alert("구글 로그인 SDK는 다음 단계에서 붙입니다.")}
        style={{ width: "100%", padding: 12, marginBottom: 12 }}
      >
        Sign in with Google
      </button>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
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