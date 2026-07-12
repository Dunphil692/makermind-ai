import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { authFetch } from "../lib/auth";

export function ParentPage() {
  const [children, setChildren] = useState<
    {
      studentId: string;
      name: string;
      grade?: string;
      progress: { title?: string; progressPercent?: number; projectId?: string }[];
      sessions: unknown[];
      feedbacks: unknown[];
      works: unknown[];
      summary: { averageProgress?: number };
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await authFetch("/api/students");
      const data = await res.json();
      const rows = await Promise.all(
        (data.students || []).map(async (s: { studentId: string; name: string; grade?: string }) => {
          const [pRes, seRes, fRes, wRes] = await Promise.all([
            authFetch(`/api/students/${s.studentId}/progress`),
            authFetch(`/api/students/${s.studentId}/sessions`),
            authFetch(`/api/students/${s.studentId}/feedbacks`),
            authFetch(`/api/students/${s.studentId}/works`)
          ]);
          const p = await pRes.json();
          const se = await seRes.json();
          const f = await fRes.json();
          const w = await wRes.json();
          return {
            ...s,
            progress: p.progress || [],
            summary: p.summary || {},
            sessions: se.sessions || [],
            feedbacks: f.feedbacks || [],
            works: w.works || []
          };
        })
      );
      setChildren(rows);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  const avg = children.length
    ? Math.round(children.reduce((a, s) => a + (s.summary.averageProgress || 0), 0) / children.length)
    : 0;

  return (
    <Layout
      navItems={[
        { to: "/", label: "首页", end: true },
        { to: "/parent", label: "成长报告" },
        { to: "/dashboard", label: "工作台" }
      ]}
    >
      <main className="dashboard-wrap role-workspace parent-workspace">
        <div className="dash-header role-hero parent-hero">
          <div className="dash-greeting">
            <span className="eyebrow">PARENT REPORT</span>
            <h1>孩子成长报告</h1>
            <p>同步老师端和学生端：项目进度、课堂总结、老师反馈和作品展示。</p>
          </div>
        </div>
        <div className="dash-stats">
          <div className="dash-stat">
            <strong>{children.length}</strong>
            <span>孩子</span>
          </div>
          <div className="dash-stat">
            <strong>{avg}%</strong>
            <span>平均进度</span>
          </div>
        </div>
        <section className="project-grid">
          {loading && <div className="loading-spin">加载中…</div>}
          {children.map((child) => {
            const current = child.progress[0];
            const pct = current?.progressPercent || 0;
            return (
              <article className="project-card connected-card parent-report-card" key={child.studentId}>
                <div className="project-card-body">
                  <div className="card-topline">
                    <span>成长报告</span>
                    <strong>{child.name}</strong>
                  </div>
                  <p className="project-card-meta">
                    <strong>当前项目：</strong>
                    {current?.title || "暂无项目"} · 进度 {pct}%
                  </p>
                  <p className="project-card-meta">
                    课堂 {child.sessions.length} · 反馈 {child.feedbacks.length} · 作品 {child.works.length}
                  </p>
                  {current && (
                    <Link
                      className="pc-btn"
                      to={`/generator?project=${encodeURIComponent(current.projectId || "")}&studentId=${encodeURIComponent(child.studentId)}`}
                    >
                      查看项目方案
                    </Link>
                  )}
                  <span className="readonly-note">家长端只读，反馈由老师端同步。</span>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </Layout>
  );
}
