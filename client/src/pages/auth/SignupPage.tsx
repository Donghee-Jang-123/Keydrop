import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { localSignup, googleLogin, googleSignupComplete } from "../../api/authApi";
import type { DJLevel } from "../../api/authApi";
import { authStore } from "../../store/authStore";

const djLevels: DJLevel[] = ["beginner", "advanced", "expert"];

export default function SignupPage() {
  const nav = useNavigate();

  const [googleMode, setGoogleMode] = useState(false);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [djLevel, setDjLevel] = useState<DJLevel>("beginner");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const pwOk = useMemo(
    () => password.length > 0 && password === passwordConfirm,
    [password, passwordConfirm]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (googleMode) {
      try {
        await googleSignupComplete({
          nickname,
          birthDate,
          djLevel,
        });
        nav("/tutorial");
      } catch {
        setErr("구글 회원가입 완료에 실패했습니다. 입력값을 확인해주세요.");
      }
      return;
    }

    if (!pwOk) {
      setErr("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const res = await localSignup({
        email,
        password,
        passwordConfirm,
        nickname,
        birthDate,
        djLevel,
      });
      authStore.setToken(res.accessToken);
      nav("/tutorial");
    } catch {
      setErr("회원가입에 실패했습니다. 입력값을 확인해주세요.");
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "60px auto" }}>
      <h2>Signup</h2>

      <div style={{ marginBottom: 12 }}>
        <GoogleLogin
          useOneTap={false}
          onSuccess={async (credRes) => {
            try {
              const credential = credRes.credential;
              if (!credential) throw new Error("no credential");

              const res = await googleLogin({ credential });
              authStore.setToken(res.accessToken);

              console.log("google login res =", res);

              if (res.isNewUser) {
                setGoogleMode(true);
                setErr(null);
                return;
              }

              nav("/tutorial");
            } catch {
              setErr("구글 로그인에 실패했습니다.");
            }
          }}
          onError={() => setErr("구글 로그인에 실패했습니다.")}
        />
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        {!googleMode && (
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        )}
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Nickname" />
        <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)} type="date" />

        <label>
          DJ Level
          <select value={djLevel} onChange={(e) => setDjLevel(e.target.value as DJLevel)}>
            {djLevels.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>

        {!googleMode && (
          <>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
            <input value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Password Confirm" type="password" />
          </>
        )}

        {!pwOk && passwordConfirm.length > 0 && (
          <div style={{ color: "crimson" }}>비밀번호가 일치하지 않습니다.</div>
        )}
        {err && <div style={{ color: "crimson" }}>{err}</div>}

        <button type="submit" style={{ padding: 12 }}>회원가입 완료</button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={() => nav("/login")}>로그인으로</button>
      </div>
    </div>
  );
}