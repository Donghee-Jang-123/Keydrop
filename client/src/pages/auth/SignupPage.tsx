import { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { localSignup, googleLogin, googleSignupComplete } from "../../api/authApi";
import type { DJLevel } from "../../api/authApi";
import { authStore } from "../../store/authStore";

const djLevels: DJLevel[] = ["beginner", "advanced", "expert"];

export default function SignupPage() {
  const nav = useNavigate();
  const location = useLocation();

  const [googleMode, setGoogleMode] = useState(false);
  // pendingGoogleCred 제거 (이제 사용 안 함)

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [djLevel, setDjLevel] = useState<DJLevel>("beginner");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // LoginPage에서 넘어온 상태 확인
  useEffect(() => {
    console.log("SignupPage State:", location.state);

    // 1. Router State 확인
    if (location.state?.isGoogle) {
      setGoogleMode(true);
      if (location.state.email) setEmail(location.state.email);
      return;
    }

    // 2. SessionStorage 확인 (Fallback)
    const storedEmail = sessionStorage.getItem("pendingGoogleEmail");
    const storedMode = sessionStorage.getItem("pendingGoogleMode");

    if (storedMode === "true") {
      setGoogleMode(true);
      if (storedEmail) setEmail(storedEmail);

      // Strict Mode에서 두 번 실행되면서 데이터가 날아가는 것을 방지하기 위해
      // 여기서는 삭제하지 않음. (나중에 성공하면 삭제하거나, 덮어씌워지게 둠)
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
        // SessionStorage에서 임시 토큰 가져오기
        const token = sessionStorage.getItem("pendingSignupToken") || undefined;

        // 이미 SignupToken이 있다면(로그인페이지에서 왔거나 등), googleSignupComplete만 호출하면 끝.
        // 이메일은 ReadOnly지만 혹시 모르니 보냄 (서버가 null 체크해서 무시함)
        const res = await googleSignupComplete(
          { nickname, birthDate, djLevel, email: email || undefined },
          { signupToken: token }
        );

        // 성공 시 사용한 임시 토큰 등 정리
        sessionStorage.removeItem("pendingSignupToken");
        sessionStorage.removeItem("pendingGoogleEmail");
        sessionStorage.removeItem("pendingGoogleMode");

        // 완료 시 AccessToken이 바로 옴
        authStore.setToken(res.accessToken);
        nav("/tutorial");
      } catch (err: any) {
        const msg = err?.response?.data?.error || "구글 회원가입 완료에 실패했습니다.";
        setErr(msg);
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

      if (res.isNewUser) {
        setErr("프로필 상태가 올바르지 않습니다. 다시 시도해주세요.");
        return;
      }

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

              console.log("google login res =", res);

              if (res.isNewUser) {
                if (res.signupToken) {
                  // authStore.setToken(res.signupToken); // <-- 이거 하면 리다이렉트 됨!
                  sessionStorage.setItem("pendingSignupToken", res.signupToken);
                }

                setGoogleMode(true);
                // 서버에서 전달받은 이메일이 있으면 세팅
                if (res.email) setEmail(res.email);
                setErr(null);
                return;
              }

              authStore.setToken(res.accessToken);
              nav("/tutorial");
            } catch (err: any) {
              // 에러 객체에서 서버 메시지 추출 시도
              const msg = err?.response?.data?.error || "구글 로그인에 실패했습니다.";
              setErr(msg);
            }
          }}
          onError={() => setErr("구글 로그인에 실패했습니다.")}
        />
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          disabled={googleMode}
          style={googleMode ? { backgroundColor: "#f0f0f0", color: "#666" } : {}}
        />

        <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Nickname" />
        <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)} type="date" />

        <label>
          DJ Level
          <select value={djLevel} onChange={(e) => setDjLevel(e.target.value as DJLevel)}>
            {djLevels.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        {!googleMode && (
          <>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
            />
            <input
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Password Confirm"
              type="password"
            />
          </>
        )}

        {!googleMode && !pwOk && passwordConfirm.length > 0 && (
          <div style={{ color: "crimson" }}>비밀번호가 일치하지 않습니다.</div>
        )}
        {err && <div style={{ color: "crimson" }}>{err}</div>}

        <button type="submit" style={{ padding: 12 }}>
          회원가입 완료
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={() => nav("/login")}>
          로그인으로
        </button>
      </div>
    </div >
  );
}