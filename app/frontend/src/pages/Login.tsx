import { useState } from "react";
import { useAuth } from "../auth";
import { Button } from "../components";

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <span className="wordmark">Merci Momong</span>
        <label className="field">
          <span className="lbl">이메일</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </label>
        <label className="field">
          <span className="lbl">비밀번호</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {error && <div className="error">{error}</div>}
        <Button type="submit" block disabled={busy}>
          {busy ? "로그인 중…" : "로그인"}
        </Button>
        <div className="hint">
          데모 계정 (비밀번호: password123)
          <br />
          designer@merci.dev · leader@merci.dev
          <br />
          educator@merci.dev · admin@merci.dev
        </div>
      </form>
    </div>
  );
}
