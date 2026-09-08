import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Instruction, MaterialItem, StepItem, TrainingItem } from "../types";
import { getCurrentTimeText, getImageInfo } from "../helpers";

const TOC_SECTIONS = [
  { id: "sec-overview", label: "项目概述" },
  { id: "sec-flow", label: "交互流程" },
  { id: "sec-materials", label: "材料清单" },
  { id: "sec-steps", label: "制作步骤" },
  { id: "sec-knowledge", label: "知识点讲解" },
  { id: "sec-mastery", label: "融会贯通训练" },
  { id: "sec-code", label: "代码思路" },
  { id: "sec-extensions", label: "进阶方向" },
  { id: "sec-faq", label: "常见问题" }
];

function ListBlock({ title, items }: { title?: string; items?: string[] }) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;
  return (
    <>
      {title ? <h4>{title}</h4> : null}
      <ul>
        {list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}

function MaterialsTable({ materials }: { materials?: MaterialItem[] }) {
  const list = Array.isArray(materials) ? materials : [];
  if (!list.length) return <p>暂无材料清单。</p>;
  return (
    <table className="instruction-table">
      <thead>
        <tr>
          <th>材料</th>
          <th>数量</th>
          <th>用途</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        {list.map((item) => (
          <tr key={`${item.name}-${item.quantity}`}>
            <td>{item.name}</td>
            <td>{item.quantity}</td>
            <td>{item.usage}</td>
            <td>{item.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StepsBlock({ steps }: { steps?: StepItem[] }) {
  const list = Array.isArray(steps) ? steps : [];
  if (!list.length) return <p>暂无制作步骤。</p>;
  return (
    <>
      {list.map((step, i) => (
        <details key={step.title} open={i === 0}>
          <summary>
            Step {i + 1}: {step.title}（{step.duration}）
          </summary>
          <div className="detail-content">
            <p>{step.content}</p>
            {step.tips ? <div className="tips-box">{step.tips}</div> : null}
            {step.warning ? <div className="warning-box">{step.warning}</div> : null}
          </div>
        </details>
      ))}
    </>
  );
}

function KnowledgeBlock({ k }: { k: Instruction["knowledgeExplanation"] }) {
  return (
    <>
      <details open>
        <summary>核心概念</summary>
        <div className="detail-content">
          <p>{k?.coreConcept}</p>
        </div>
      </details>
      <details>
        <summary>关键公式 / 规则</summary>
        <div className="detail-content">
          <div className="formula-box">{k?.keyFormula}</div>
        </div>
      </details>
      <details>
        <summary>在项目中的应用</summary>
        <div className="detail-content">
          <p>{k?.inProject}</p>
        </div>
      </details>
      <details>
        <summary>深入理解与常见误区</summary>
        <div className="detail-content">
          <p>
            <strong>深入理解：</strong>
            {k?.deepUnderstanding}
          </p>
          <p>
            <strong>常见误区：</strong>
            {k?.commonMisunderstanding}
          </p>
        </div>
      </details>
    </>
  );
}

function MasteryBlock({ training }: { training: Instruction["masteryTraining"] }) {
  const items: [string, TrainingItem | undefined][] = [
    ["基础练习", training?.basicPractice],
    ["变化挑战", training?.variationChallenge],
    ["逆向思维", training?.reverseThinking],
    ["综合应用", training?.comprehensiveApplication],
    ["举一反三", training?.transferQuestion]
  ];
  return (
    <>
      {items.map(([title, item], i) => (
        <details key={title} open={i === 0}>
          <summary>{title}</summary>
          <div className="detail-content training-card">
            <p>
              <strong>任务：</strong>
              {item?.task}
            </p>
            <p>
              <strong>提示：</strong>
              {item?.hint}
            </p>
            <p>
              <strong>参考答案：</strong>
              {item?.answer}
            </p>
          </div>
        </details>
      ))}
    </>
  );
}

function FaqBlock({ faq }: { faq: Instruction["faq"] }) {
  const list = Array.isArray(faq) ? faq : [];
  if (!list.length) return <p>暂无常见问题。</p>;
  return (
    <>
      {list.map((item, i) => (
        <details key={item.question}>
          <summary>
            Q{i + 1}: {item.question}
          </summary>
          <div className="detail-content">
            <p>{item.answer}</p>
          </div>
        </details>
      ))}
    </>
  );
}

function CodeCard({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!code.trim()) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="code-copy-card">
      <div className="code-copy-header">
        <span className="code-dot red" />
        <span className="code-dot yellow" />
        <span className="code-dot green" />
        <strong>{label}</strong>
        <button className={`copy-code-btn compact${copied ? " copied" : ""}`} type="button" onClick={copyCode} aria-label={`复制 ${label}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{copied ? "已复制" : "复制"}</span>
        </button>
      </div>
      <pre className="instruction-code">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function ReadingProgress() {
  useEffect(() => {
    const bar = document.createElement("div");
    bar.id = "readingProgressBar";
    bar.className = "reading-progress";
    document.body.appendChild(bar);

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const doc = document.querySelector(".instruction-doc");
          if (!doc) {
            bar.style.width = "0";
            ticking = false;
            return;
          }
          const docTop = doc.getBoundingClientRect().top;
          const docHeight = (doc as HTMLElement).offsetHeight;
          const viewHeight = window.innerHeight;
          const scrolled = -docTop + viewHeight;
          const total = docHeight + viewHeight;
          const progress = Math.min(100, Math.max(0, (scrolled / total) * 100));
          bar.style.width = `${progress}%`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      bar.remove();
    };
  }, []);

  return null;
}

export interface InstructionViewProps {
  instruction: Instruction;
  isRealGeneration: boolean;
  generateCount: number;
  concept: string;
  onSave: () => void;
  onRegenerate: () => void;
  regenerateDisabled?: boolean;
  onExport: () => void;
  onShare: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
}

/** React 版 renderInstruction，保留原有 DOM 结构与样式类名 */
export function InstructionView({
  instruction,
  isRealGeneration,
  generateCount,
  concept,
  onSave,
  onRegenerate,
  regenerateDisabled = false,
  onExport,
  onShare,
  saveLabel = "⭐ 收藏此方案",
  saveDisabled = false
}: InstructionViewProps) {
  const imageInfo = getImageInfo(instruction);
  const [activeSection, setActiveSection] = useState("sec-overview");
  const docRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sections = TOC_SECTIONS.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [instruction]);

  const degradedParts = instruction._degradedParts || [];
  const degradedLabels = { overview: "项目概述", build: "制作步骤", practice: "融会训练" } as const;

  return (
    <div className="instruction-with-toc">
      <ReadingProgress />
      <nav className="instruction-toc" aria-label="方案目录">
        <h4>📑 快速导航</h4>
        {TOC_SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={activeSection === id ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {label}
          </a>
        ))}
      </nav>

      <article className="instruction-doc" ref={docRef}>
        {degradedParts.length > 0 ? (
          <div className="tips-box" style={{ marginBottom: 16 }}>
            AI 服务刚才不稳定，
            {degradedParts.map((part) => degradedLabels[part as keyof typeof degradedLabels] || part).join("、")}
            已使用基础模板兜底。当前方案可以先用，稍后可清空草稿重新生成优化。
          </div>
        ) : null}

        <header className="instruction-hero">
          <div>
            <div
              className="demo-badge"
              style={isRealGeneration ? { background: "rgba(0,212,170,0.12)", color: "#0f766e" } : undefined}
            >
              {isRealGeneration ? "✅ AI 实时生成" : "📋 示例方案 · 基于真实AI生成"}
            </div>
            <p className="instruction-kicker">STEAM 项目指导</p>
            <h2>{instruction.projectName || `${concept} 学习方案`}</h2>
            <p>{instruction.subtitle}</p>
            <div className="instruction-meta">
              <span>{instruction.meta?.studentLevel}</span>
              <span>📚 {instruction.meta?.knowledgePoint}</span>
              <span>⏱ {instruction.meta?.timeRequired}</span>
              <span>🔧 {instruction.meta?.hardware}</span>
            </div>
          </div>
        </header>

        <figure className="instruction-visual">
          <img src={imageInfo.image} alt={instruction.projectName || concept} loading="lazy" />
          <figcaption>
            <strong>{imageInfo.title}</strong>
            <span>{imageInfo.caption}</span>
          </figcaption>
        </figure>

        <div className="action-bar">
          <button type="button" className="btn primary small" onClick={onSave} disabled={saveDisabled}>
            {saveLabel}
          </button>
          <button type="button" className="btn ghost small" onClick={onRegenerate} disabled={regenerateDisabled}>
            {regenerateDisabled ? "AI 生成已暂停" : "🔄 重新生成"}
          </button>
          {instruction._assignedStudentId ? (
            <Link className="btn primary small" to={`/teacher#student-${encodeURIComponent(instruction._assignedStudentId)}`}>
              已布置，回教师端
            </Link>
          ) : null}
          {instruction._assignedStudentId ? (
            <Link
              className="btn ghost small"
              to={`/session?studentId=${encodeURIComponent(instruction._assignedStudentId)}&studentProjectId=${encodeURIComponent(instruction._studentProjectId || "")}`}
            >
              📝 录入课堂
            </Link>
          ) : null}
          <button type="button" className="btn ghost small" onClick={onExport}>
            📄 导出文本
          </button>
          <button type="button" className="btn ghost small" onClick={onShare}>
            🔗 分享链接
          </button>
          <button type="button" className="btn ghost small" onClick={() => window.print()}>
            🖨️ 打印
          </button>
        </div>

        <section className="instruction-section" id="sec-overview">
          <h3>📋 项目概述</h3>
          <div className="highlight-box">
            <strong>🎯 核心目标：</strong>
            {instruction.overview?.coreGoal}
          </div>
          {instruction.overview?.teacherHook ? (
            <div className="tips-box">
              <strong>💬 老师开场白：</strong>
              {instruction.overview.teacherHook}
            </div>
          ) : null}
          <p>
            <strong>📖 项目简介：</strong>
            {instruction.overview?.projectIntro}
          </p>
          <p>
            <strong>🎮 为什么学生会想玩：</strong>
            {instruction.overview?.whyFun}
          </p>
          <ListBlock title="💡 为什么这个项目能帮助学习" items={instruction.overview?.learningReasons} />
        </section>

        <section className="instruction-section" id="sec-flow">
          <h3>🔄 交互流程预览</h3>
          <div className="flow-grid">
            <div>
              <span>🎯 触发</span>
              <strong>{instruction.interactionFlow?.trigger}</strong>
            </div>
            <div>
              <span>⚙️ 计算</span>
              <strong>{instruction.interactionFlow?.calculation}</strong>
            </div>
            <div>
              <span>📊 等级</span>
              <strong>{instruction.interactionFlow?.level}</strong>
            </div>
          </div>
          <ListBlock title="📢 反馈方式" items={instruction.interactionFlow?.feedback} />
          <div className="tips-box">{instruction.interactionFlow?.levelReason}</div>
        </section>

        <section className="instruction-section" id="sec-materials">
          <h3>📦 材料清单</h3>
          <div className="table-responsive">
            <MaterialsTable materials={instruction.materials} />
          </div>
        </section>

        <section className="instruction-section" id="sec-steps">
          <h3>🔨 制作步骤</h3>
          <StepsBlock steps={instruction.steps} />
        </section>

        <section className="instruction-section" id="sec-knowledge">
          <h3>🧠 知识点讲解</h3>
          <KnowledgeBlock k={instruction.knowledgeExplanation} />
        </section>

        <section className="instruction-section mastery-block" id="sec-mastery">
          <h3>🏋️ 融会贯通训练</h3>
          <MasteryBlock training={instruction.masteryTraining} />
        </section>

        <section className="instruction-section code-thought-section" id="sec-code">
          <div className="code-section-title">
            <div>
              <h3>💻 代码思路</h3>
              <p>同一个硬件逻辑提供两种写法：C++ / Arduino 与 MicroPython / K10。</p>
            </div>
          </div>
          <div className="code-language-grid">
            <CodeCard label="C++ / Arduino" code={instruction.starterCodeCpp || "// C++ / Arduino 代码示例"} />
            <CodeCard label="MicroPython / K10" code={instruction.starterCodePython || "# MicroPython / K10 代码示例"} />
          </div>
        </section>

        <section className="instruction-section" id="sec-extensions">
          <h3>🚀 进阶方向</h3>
          <ListBlock items={instruction.extensions} />
        </section>

        <section className="instruction-section" id="sec-faq">
          <h3>❓ 常见问题</h3>
          <FaqBlock faq={instruction.faq} />
        </section>
      </article>
      <span className="sr-only" aria-live="polite">
        {generateCount === 0 ? `示例方案 · ${getCurrentTimeText()}` : `已生成 ${generateCount} 次 · ${getCurrentTimeText()}`}
      </span>
    </div>
  );
}
