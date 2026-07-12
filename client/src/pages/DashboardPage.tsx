import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAuth } from "../hooks/useAuth";
import { authFetch, displayName } from "../lib/auth";
import { formatDate, imageUrl } from "../lib/utils";

interface Project {
  id: string;
  title: string;
  subject?: string;
  concept?: string;
  interest?: string;
  imageKey?: string;
  image_key?: string;
  createdAt?: string;
  created_at?: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"projects" | "favorites">("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [favorites, setFavorites] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [pRes, fRes] = await Promise.all([
          authFetch("/api/projects"),
          authFetch("/api/favorites")
        ]);
        const pData = await pRes.json();
        const fData = await fRes.json();
        setProjects(pData.projects || []);
        setFavorites(fData.favorites || []);
      } catch {
        setError("加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function removeProject(id: string) {
    if (!confirm("确定删除这个项目方案吗？")) return;
    const res = await authFetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) setProjects((list) => list.filter((p) => p.id !== id));
  }

  const data = tab === "projects" ? projects : favorites;

  return (
    <Layout
      navItems={[
        { to: "/", label: "首页", end: true },
        { to: "/generator", label: "任务生成器" },
        { to: "/about", label: "关于我们" }
      ]}
    >
      <main className="dashboard-wrap">
        <div className="dash-header">
          <div className="dash-greeting">
            <h1>你好，{displayName(user)}</h1>
            <p>{user?.role === "teacher" ? "教师工作台 · 管理你的项目方案" : "学生工作台 · 查看分配给你的项目"}</p>
          </div>
          <Link className="dash-new-btn" to="/generator">
            + 生成新方案
          </Link>
        </div>
        <div className="dash-stats">
          <div className="dash-stat">
            <strong>{projects.length}</strong>
            <span>项目方案</span>
          </div>
          <div className="dash-stat">
            <strong>{favorites.length}</strong>
            <span>收藏</span>
          </div>
        </div>
        <div className="dash-tabs">
          <button className={`dash-tab ${tab === "projects" ? "active" : ""}`} onClick={() => setTab("projects")} type="button">
            我的项目
          </button>
          <button className={`dash-tab ${tab === "favorites" ? "active" : ""}`} onClick={() => setTab("favorites")} type="button">
            我的收藏
          </button>
        </div>
        <div className="project-grid">
          {loading && <div className="loading-spin">加载中…</div>}
          {error && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>{error}</h3>
            </div>
          )}
          {!loading && !error && data.length === 0 && (
            <div className={`empty-state ${tab === "projects" ? "welcome-empty" : ""}`}>
              <h3>{tab === "favorites" ? "还没有收藏任何方案" : "欢迎来到 MakerMind AI！"}</h3>
              <p>{tab === "favorites" ? "生成方案后点击收藏，方便快速回顾。" : "从这里开始你的第一堂 AI 驱动的 STEAM 项目课。"}</p>
              <Link className="btn primary small" to="/generator">
                去生成
              </Link>
            </div>
          )}
          {data.map((p) => {
            const img = p.imageKey || p.image_key;
            const isFav = tab === "favorites";
            return (
              <article className="project-card" key={p.id}>
                <div className="card-thumb-wrap">
                  <img
                    className="project-card-img"
                    src={imageUrl(img)}
                    alt={p.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/assets/reaction-trainer.jpg";
                    }}
                  />
                  {isFav && <span className="fav-badge">★ 收藏</span>}
                </div>
                <div className="project-card-body">
                  <h3 className="project-card-title">{p.title}</h3>
                  <div className="project-card-tags">
                    {p.subject && <span className="project-tag">{p.subject}</span>}
                    {p.concept && <span className="project-tag concept">{p.concept}</span>}
                    {p.interest && <span className="project-tag">{p.interest}</span>}
                  </div>
                  <p className="project-card-meta">{formatDate(p.createdAt || p.created_at)}</p>
                  <div className="project-card-actions">
                    <Link className={`pc-btn ${isFav ? "primary" : ""}`} to={`/generator?project=${p.id}`}>
                      查看{isFav ? "方案" : ""}
                    </Link>
                    {!isFav && (
                      <button className="pc-btn danger" type="button" onClick={() => removeProject(p.id)}>
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </Layout>
  );
}
