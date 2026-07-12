import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { authFetch } from "../lib/auth";

export function StudentPage() {
  const [student, setStudent] = useState<{
    studentId: string;
    name: string;
    projects: { id: string; title?: string; projectId?: string; progressPercent?: number }[];
    feedbacks: { content?: string }[];
    sessions: { structuredSummary?: string; teacherNotes?: string }[];
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [workName, setWorkName] = useState("");
  const [workUrl, setWorkUrl] = useState("");
  const [workReflection, setWorkReflection] = useState("");
  const [activeProject, setActiveProject] = useState<{ id: string; title?: string } | null>(null);

  useEffect(() => {
    (async () => {
      const sRes = await authFetch("/api/students");
      const sData = await sRes.json();
      const current = (sData.students || [])[0];
      if (!current) return;
      const [pRes, fRes, seRes] = await Promise.all([
        authFetch(`/api/students/${current.studentId}/projects`),
        authFetch(`/api/students/${current.studentId}/feedbacks`),
        authFetch(`/api/students/${current.studentId}/sessions`)
      ]);
      const p = await pRes.json();
      const f = await fRes.json();
      const se = await seRes.json();
      setStudent({
        ...current,
        projects: p.projects || [],
        feedbacks: f.feedbacks || [],
        sessions: se.sessions || []
      });
    })().catch(() => undefined);
  }, []);

  async function submitWork(e: FormEvent) {
    e.preventDefault();
    if (!student || !workName.trim()) return;
    const res = await authFetch(`/api/students/${student.studentId}/works`, {
      method: "POST",
      body: JSON.stringify({
        workName: workName.trim(),
        fileUrl: workUrl.trim() || undefined,
        reflection: workReflection.trim() || undefined,
        studentProjectId: activeProject?.id
      })
    });
    if (res.ok) {
      setModalOpen(false);
      alert("作品已提交");
    } else {
      const data = await res.json();
      alert(data.error || "提交失败");
    }
  }

  const current = student?.projects[0];

  return (
    <Layout
      navItems={[
        { to: "/", label: "首页", end: true },
        { to: "/student", label: "我的任务" },
        { to: "/generator", label: "查看方案" }
      ]}
    >
      <main className="dashboard-wrap role-workspace student-workspace">
        <div className="dash-header role-hero student-hero">
          <div className="dash-greeting">
            <span className="eyebrow">STUDENT MISSION</span>
            <h1>我的项目任务板</h1>
            <p>老师布置的项目、课堂反馈和作品提交都在这里。</p>
          </div>
        </div>
        {current && (
          <section className="student-focus">
            <article className="mission-hero-card">
              <div>
                <span>当前主线任务</span>
                <h2>{current.title || "未命名项目"}</h2>
                <strong>{current.progressPercent || 0}%</strong>
              </div>
              <div className="project-card-actions">
                <Link
                  className="pc-btn primary"
                  to={`/generator?project=${encodeURIComponent(current.projectId || "")}&studentId=${encodeURIComponent(student?.studentId || "")}`}
                >
                  打开项目方案
                </Link>
                <button
                  type="button"
                  className="pc-btn"
                  onClick={() => {
                    setActiveProject(current);
                    setWorkName(`${current.title || "项目"} 作品`);
                    setModalOpen(true);
                  }}
                >
                  提交作品
                </button>
              </div>
            </article>
          </section>
        )}
        <section className="role-section">
          <div className="section-heading">
            <h2>老师反馈与课堂成长</h2>
          </div>
          <div className="insight-grid">
            {(student?.feedbacks[0] && (
              <article className="insight-card">
                <span>老师反馈</span>
                <p>{student.feedbacks[0].content}</p>
              </article>
            )) ||
              (student?.sessions[0] && (
                <article className="insight-card">
                  <span>课堂总结</span>
                  <p>{student.sessions[0].structuredSummary || student.sessions[0].teacherNotes}</p>
                </article>
              )) || <div className="empty-state">暂无反馈</div>}
          </div>
        </section>
      </main>
      {modalOpen && (
        <div className="modal-overlay inline-form-modal" style={{ display: "grid" }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>提交作品</h3>
              <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </div>
            <form className="modal-body" onSubmit={submitWork}>
              <div className="form-group">
                <label>作品名称 *</label>
                <input value={workName} onChange={(e) => setWorkName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>作品链接（可选）</label>
                <input value={workUrl} onChange={(e) => setWorkUrl(e.target.value)} type="url" />
              </div>
              <div className="form-group">
                <label>想对老师说的话（可选）</label>
                <textarea value={workReflection} onChange={(e) => setWorkReflection(e.target.value)} rows={3} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn ghost small" onClick={() => setModalOpen(false)}>
                  取消
                </button>
                <button type="submit" className="btn primary small">
                  提交作品
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
