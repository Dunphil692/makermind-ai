import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { authFetch } from "../lib/auth";

export function SessionPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState<{ studentId: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; title?: string; projectId?: string; progressPercent?: number }[]>([]);
  const [studentId, setStudentId] = useState(params.get("studentId") || "");
  const [projectId, setProjectId] = useState(params.get("studentProjectId") || "");
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState("");
  const [structured, setStructured] = useState<Record<string, unknown> | null>(null);
  const [resultHtml, setResultHtml] = useState("尚未结构化");
  const [speechHint, setSpeechHint] = useState("Chrome 可使用语音识别；不支持时可直接手动输入。");
  const [busy, setBusy] = useState(false);
  const recognitionRef = useMemo(() => ({ current: null as SpeechRecognition | null }), []);

  useEffect(() => {
    authFetch("/api/students")
      .then((r) => r.json())
      .then((data) => {
        const list = data.students || [];
        setStudents(list);
        if (!studentId && list[0]) setStudentId(list[0].studentId);
      })
      .catch(() => setSpeechHint("加载学生失败"));
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    authFetch(`/api/students/${encodeURIComponent(studentId)}/projects`)
      .then((r) => r.json())
      .then((data) => {
        const list = data.projects || [];
        setProjects(list);
        if (!projectId && list[0]) setProjectId(list[0].id);
      })
      .catch(() => undefined);
  }, [studentId, projectId]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechHint("当前浏览器不支持语音识别，请手动输入课堂记录。");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;
    let finalText = "";
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += `${text}。`;
        else interim += text;
      }
      setTranscript(finalText + interim);
    };
    recognitionRef.current = recognition;
  }, [recognitionRef]);

  async function onStructure() {
    if (!transcript.trim()) return alert("请先输入或录入课堂文本");
    setBusy(true);
    setResultHtml("AI 正在分析课堂记录…");
    try {
      const res = await authFetch("/api/sessions/structure", {
        method: "POST",
        body: JSON.stringify({ studentId, rawTranscript: transcript.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setResultHtml(`结构化失败：${data.error || JSON.stringify(data)}`);
        return;
      }
      setStructured(data.structured);
      setResultHtml(JSON.stringify(data.structured, null, 2));
    } catch {
      setResultHtml("结构化失败：网络错误");
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    if (!structured || !projectId) return;
    const payload = {
      ...structured,
      studentProjectId: projectId,
      rawTranscript: transcript.trim(),
      durationMinutes: Number(duration) || null,
      inputMethod: "VOICE_OR_MANUAL"
    };
    const res = await authFetch("/api/sessions", { method: "POST", body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "保存失败");
    const backTeacher = confirm(
      `已保存课堂记录，当前进度：${data.progressPercent}%。\n确定回教师端，取消则去生成下个项目。`
    );
    if (backTeacher) navigate("/teacher");
    else navigate(`/generator?studentId=${encodeURIComponent(studentId)}`);
  }

  return (
    <Layout
      navItems={[
        { to: "/", label: "首页", end: true },
        { to: "/teacher", label: "教师端" },
        { to: "/generator", label: "任务生成器" }
      ]}
    >
      <main className="dashboard-wrap">
        <div className="dash-header">
          <div className="dash-greeting">
            <h1>课堂记录</h1>
            <p>语音转写、AI 结构化，并保存为学生项目进度事件</p>
          </div>
          <Link className="dash-new-btn" to="/teacher">
            返回教师端
          </Link>
        </div>
        <section className="project-card" style={{ padding: 24 }}>
          <div className="advanced-fields-grid">
            <label>
              选择学生
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                {students.map((s) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              选择项目实例
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.title || p.projectId) + ` · ${p.progressPercent || 0}%`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              课堂时长（分钟）
              <input value={duration} onChange={(e) => setDuration(e.target.value)} type="number" min={0} />
            </label>
          </div>
          <div className="form-section-title" style={{ marginTop: 24 }}>
            <span>VOICE / TEXT</span>
            <h2>课堂转写</h2>
            <p>{speechHint}</p>
          </div>
          <textarea
            className="dialogue-input"
            rows={8}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="点击开始录音，或手动输入课堂记录"
            style={{ minHeight: 180, width: "100%" }}
          />
          <div className="project-card-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="pc-btn"
              onClick={() => recognitionRef.current?.start()}
              disabled={!recognitionRef.current}
            >
              开始录音
            </button>
            <button type="button" className="pc-btn" onClick={() => recognitionRef.current?.stop()}>
              停止录音
            </button>
            <button type="button" className="pc-btn primary" onClick={onStructure} disabled={busy}>
              {busy ? "AI 分析中…" : "AI 结构化"}
            </button>
          </div>
        </section>
        <section className="project-card" style={{ padding: 24, marginTop: 18 }}>
          <div className="form-section-title">
            <span>STRUCTURED JSON</span>
            <h2>结构化结果</h2>
          </div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#0f172a",
              color: "#e2e8f0",
              borderRadius: 16,
              padding: 16,
              minHeight: 220
            }}
          >
            {resultHtml}
          </pre>
          <div className="project-card-actions" style={{ marginTop: 12 }}>
            <button type="button" className="pc-btn primary" onClick={onSave} disabled={!structured}>
              保存记录
            </button>
          </div>
        </section>
      </main>
    </Layout>
  );
}
