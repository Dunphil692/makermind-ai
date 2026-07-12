import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { authFetch } from "../lib/auth";

interface StudentRow {
  studentId: string;
  name: string;
  current?: { id: string; progressPercent?: number };
  works: unknown[];
  feedbacks: unknown[];
  sessions: unknown[];
  summary: { averageProgress?: number };
}

export function TeacherPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await authFetch("/api/students");
      const data = await res.json();
      const rows = await Promise.all(
        (data.students || []).map(async (s: { studentId: string; name: string }) => {
          const [pRes, fRes, wRes, seRes] = await Promise.all([
            authFetch(`/api/students/${s.studentId}/progress`),
            authFetch(`/api/students/${s.studentId}/feedbacks`),
            authFetch(`/api/students/${s.studentId}/works`),
            authFetch(`/api/students/${s.studentId}/sessions`)
          ]);
          const p = await pRes.json();
          const f = await fRes.json();
          const w = await wRes.json();
          const se = await seRes.json();
          const progress = p.progress || [];
          return {
            ...s,
            progress,
            summary: p.summary || {},
            feedbacks: f.feedbacks || [],
            works: w.works || [],
            sessions: se.sessions || [],
            current: progress[0]
          };
        })
      );
      setStudents(rows);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  const avg = students.length
    ? Math.round(students.reduce((a, s) => a + (s.summary.averageProgress || 0), 0) / students.length)
    : 0;

  const queue = students.flatMap((s) => {
    const items: { type: string; msg: string; href: string }[] = [];
    const pct = s.current?.progressPercent || 0;
    if (!s.current) {
      items.push({
        type: "待布置",
        msg: "还没有项目任务，先去生成器按画像生成。",
        href: `/generator?studentId=${encodeURIComponent(s.studentId)}`
      });
    }
    if (s.current && pct < 40) {
      items.push({
        type: "进度预警",
        msg: `当前项目只有 ${pct}%，建议录入课堂记录。`,
        href: `/session?studentId=${encodeURIComponent(s.studentId)}&studentProjectId=${encodeURIComponent(s.current.id)}`
      });
    }
    if (s.works.length && !s.feedbacks.length) {
      items.push({
        type: "待反馈",
        msg: "学生已提交作品，请写反馈。",
        href: `/session?studentId=${encodeURIComponent(s.studentId)}`
      });
    }
    return items.map((item) => ({ ...item, name: s.name }));
  });

  return (
    <Layout
      navItems={[
        { to: "/", label: "首页", end: true },
        { to: "/generator", label: "个性化生成" },
        { to: "/session", label: "课堂记录" },
        { to: "/dashboard", label: "项目库" }
      ]}
    >
      <main className="dashboard-wrap role-workspace teacher-workspace">
        <div className="dash-header role-hero">
          <div className="dash-greeting">
            <span className="eyebrow">TEACHER CONTROL LOOP</span>
            <h1>教师闭环工作台</h1>
            <p>从给学生生成项目开始，串起布置任务、学生提交、课堂记录、可视化反馈和家长同步。</p>
          </div>
          <Link className="dash-new-btn" to="/generator">
            + 为学生生成新任务
          </Link>
        </div>
        <section className="loop-rail" aria-label="正循环流程">
          {["生成", "布置", "学生做", "课堂记录", "反馈同步"].map((label, i) => (
            <div key={label}>
              <strong>{`${i + 1} ${label}`}</strong>
            </div>
          ))}
        </section>
        <div className="dash-stats">
          <div className="dash-stat">
            <strong>{students.length}</strong>
            <span>学员</span>
          </div>
          <div className="dash-stat">
            <strong>{avg}%</strong>
            <span>平均进度</span>
          </div>
          <div className="dash-stat">
            <strong>{students.reduce((a, s) => a + s.works.length, 0)}</strong>
            <span>学生作品</span>
          </div>
          <div className="dash-stat">
            <strong>{students.reduce((a, s) => a + s.sessions.length, 0)}</strong>
            <span>课堂记录</span>
          </div>
        </div>
        <section className="role-section">
          <div className="section-heading">
            <div>
              <span>VISUAL FEEDBACK</span>
              <h2>待处理反馈队列</h2>
            </div>
          </div>
          <div className="insight-grid">
            {loading && <div className="loading-spin">加载中…</div>}
            {!loading &&
              (queue.length ? (
                queue.slice(0, 6).map((item) => (
                  <article className="insight-card" key={`${item.name}-${item.type}`}>
                    <span>{item.type}</span>
                    <h3>{item.name}</h3>
                    <p>{item.msg}</p>
                    <Link className="pc-btn primary" to={item.href}>
                      处理
                    </Link>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  <h3>目前没有紧急待办</h3>
                </div>
              ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
