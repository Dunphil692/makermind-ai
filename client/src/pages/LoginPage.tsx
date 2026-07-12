import { type FormEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { roleHome } from "../components/ProtectedRoute";

export function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const initialMode = params.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"teacher" | "parent" | "student">("teacher");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirect = useMemo(() => params.get("redirect") || "/dashboard", [params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body =
        mode === "register"
          ? { username, password, role }
          : { username, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.detail || "操作失败");
        return;
      }
      login(data.token, data.user);
      navigate(redirect.startsWith("/") ? redirect : roleHome(data.user), { replace: true });
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout
      navItems={[
        { to: "/", label: "首页", end: true },
        { to: "/generator", label: "任务生成器" },
        { to: "/about", label: "关于我们" }
      ]}
    >
      <main className="auth-wrap">
        <div className={`auth-card ${mode}`} id="authCard">
          <h1>{mode === "login" ? "欢迎回来" : "创建账号"}</h1>
          <p className="auth-subtitle">
            {mode === "login" ? "账号 + 密码即可登录，无需邮箱" : "注册后即可保存和收藏项目方案"}
          </p>
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => setMode("login")}
            >
              登录
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => setMode("register")}
            >
              注册
            </button>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <form id="authForm" onSubmit={onSubmit}>
            <div className="auth-field">
              <label htmlFor="username">账号</label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例如：lilaoshi"
                autoComplete="username"
                maxLength={32}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="password">密码</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  style={{ paddingRight: 44 }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="切换密码可见性"
                >
                  👁️
                </button>
              </div>
            </div>
            {mode === "register" && (
              <div className="auth-field register-only">
                <label>身份（可选）</label>
                <div className="auth-role-group">
                  {(["teacher", "parent", "student"] as const).map((r) => (
                    <label key={r}>
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={role === r}
                        onChange={() => setRole(r)}
                      />{" "}
                      {r === "teacher" ? "教师" : r === "parent" ? "家长" : "学生"}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "处理中…" : mode === "login" ? "登录" : "注册"}
            </button>
          </form>
          <p className="auth-toggle-hint login-only">
            还没有账号？{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMode("register");
              }}
            >
              立即注册
            </a>
          </p>
          <p className="auth-toggle-hint register-only">
            已有账号？{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setMode("login");
              }}
            >
              返回登录
            </a>
          </p>
        </div>
      </main>
    </Layout>
  );
}
