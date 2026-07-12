import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { displayName } from "../lib/auth";

export function ContestBanner() {
  return (
    <div className="contest-banner">
      <span>🏆 参赛项目</span>
      <strong>TRAE AI 创造力大赛 · 学习工作赛道</strong>
      <a href="https://www.trae.cn/ai-creativity" target="_blank" rel="noopener noreferrer">
        了解大赛 →
      </a>
    </div>
  );
}

type NavItem = { to: string; label: string; end?: boolean };

const marketingNav: NavItem[] = [
  { to: "/", label: "首页", end: true },
  { to: "/generator", label: "任务生成器" },
  { to: "/students", label: "学生分层" },
  { to: "/faq", label: "常见问题" },
  { to: "/about", label: "关于我们" }
];

export function Topbar({ items = marketingNav }: { items?: NavItem[] }) {
  const { loggedIn, user, logout } = useAuth();

  return (
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="brand-mark">MM</span>
        <span>
          <strong>MakerMind AI</strong>
          <small>Project-based lesson studio</small>
        </span>
      </Link>
      <nav className="nav-links">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            {item.label}
          </NavLink>
        ))}
        <div className="nav-auth-area">
          {loggedIn && user ? (
            <>
              <Link className="nav-user-link" to="/dashboard">
                {displayName(user)}
              </Link>
              <button type="button" className="nav-logout-link" onClick={logout} style={{ background: "none", border: "none", cursor: "pointer" }}>
                退出
              </button>
            </>
          ) : (
            <>
              <Link to="/login">登录</Link>
              <Link className="nav-register-link" to="/login?mode=register">
                注册
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer page-shell">
      <strong>MakerMind AI</strong>
      <span>面向科创课堂与项目式学习的互动任务生成工作台</span>
      <div className="footer-links">
        <Link to="/">首页</Link>
        <Link to="/generator">任务生成器</Link>
        <Link to="/students">学生分层</Link>
        <Link to="/faq">常见问题</Link>
        <Link to="/about">关于我们</Link>
        <a href="https://github.com/Dunphil692/makermind-ai" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}

export function Layout({
  children,
  showContest = false,
  navItems
}: {
  children: React.ReactNode;
  showContest?: boolean;
  navItems?: NavItem[];
}) {
  return (
    <>
      {showContest && <ContestBanner />}
      <Topbar items={navItems} />
      {children}
    </>
  );
}
