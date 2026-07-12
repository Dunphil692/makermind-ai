import { kitLabels, PART_LABELS } from "../constants";
import { parseGenerationError } from "../helpers";
import type { ResultView } from "../types";
import { InstructionView } from "./InstructionView";
import type { useGenerator } from "../useGenerator";

type GeneratorApi = ReturnType<typeof useGenerator>;

interface ResultPanelProps {
  api: GeneratorApi;
}

function WaitingCard({ concept, interest, kit, duration }: { concept: string; interest: string; kit: string; duration: string }) {
  return (
    <article className="instruction-empty">
      <div className="project-card-header">
        <h4>等待生成 STEAM 项目方案</h4>
        <span className="badge">未调用 AI</span>
      </div>
      <p>
        在左侧选择知识点、兴趣场景和硬件条件，然后点击"生成 STEAM 项目方案"按钮。
        系统会调用 AI 分三段生成完整的项目指导方案。
      </p>
      <div className="project-meta">
        <div>
          <span>当前知识点</span>
          <strong>{concept}</strong>
        </div>
        <div>
          <span>兴趣</span>
          <strong>{interest}</strong>
        </div>
        <div>
          <span>套件</span>
          <strong>{kit}</strong>
        </div>
        <div>
          <span>时长</span>
          <strong>{duration}</strong>
        </div>
      </div>
    </article>
  );
}

function ProgressCard({
  view,
  concept,
  interest,
  kit,
  duration
}: {
  view: Extract<ResultView, { kind: "progress" }>;
  concept: string;
  interest: string;
  kit: string;
  duration: string;
}) {
  const partStatus = (["overview", "build", "practice"] as const).map((part) => {
    const done = Boolean(view.draft?.parts?.[part]);
    const degraded = (view.draft?.degradedParts || []).includes(part);
    return (
      <span key={part} className={`brief-chip ${done ? "complete" : "missing"}`}>
        <strong>{PART_LABELS[part]}</strong>
        {done ? (degraded ? "基础模板兜底" : "已完成") : "等待中"}
      </span>
    );
  });

  return (
    <article className="instruction-empty">
      <div className="project-card-header">
        <h4>{view.title}</h4>
        <span className="badge">
          {view.step} / {view.total}
        </span>
      </div>
      <p>{view.desc}</p>
      <div className="brief-status" style={{ margin: "14px 0" }}>
        {partStatus}
      </div>
      <div className="project-meta">
        <div>
          <span>知识点</span>
          <strong>{concept}</strong>
        </div>
        <div>
          <span>兴趣</span>
          <strong>{interest}</strong>
        </div>
        <div>
          <span>套件</span>
          <strong>{kit}</strong>
        </div>
        <div>
          <span>时长</span>
          <strong>{duration}</strong>
        </div>
      </div>
      <div className="tips-box">已成功的分段会自动保留；如果中途失败，点击重试会从失败段继续。</div>
    </article>
  );
}

function ErrorCard({
  view,
  onRetry,
  onRestart
}: {
  view: Extract<ResultView, { kind: "error" }>;
  onRetry: () => void;
  onRestart: () => void;
}) {
  const { errorType, errorSuggestion } = parseGenerationError(view.message);
  return (
    <article className="instruction-empty demo-fallback-card">
      <div className="project-card-header">
        <h4>AI 生成失败：{errorType}</h4>
        <span className="badge">错误</span>
      </div>
      <p style={{ fontSize: 16, color: "#e54612", fontWeight: 600, marginBottom: 12 }}>{view.message}</p>
      <p style={{ marginTop: 12, color: "#64748b" }}>{errorSuggestion}</p>
      {view.retainedParts > 0 ? (
        <div className="tips-box">
          已保留成功生成的 {view.retainedParts}/3 段，点击重试会从失败段继续，不会浪费前面已生成内容。
        </div>
      ) : null}
      <button type="button" className="btn primary" style={{ marginTop: 16 }} onClick={onRetry}>
        {view.retainedParts > 0 ? "继续生成剩余部分" : "重新生成"}
      </button>
      {view.retainedParts > 0 ? (
        <button type="button" className="btn ghost" style={{ marginTop: 16, marginLeft: 8 }} onClick={onRestart}>
          清空草稿重新开始
        </button>
      ) : null}
    </article>
  );
}

export function ResultPanel({ api }: ResultPanelProps) {
  const {
    resultView,
    resultTitle,
    matchTag,
    updateTag,
    form,
    generateCount,
    handleSave,
    handleExport,
    handleShare,
    handleRegenerate,
    saveFlash,
    retryGenerate,
    restartGenerate
  } = api;

  const kitLabel = kitLabels[form.kit] || form.kit;

  return (
    <section className="result-panel generator-result-panel">
      <div className="result-header">
        <div>
          <span>{matchTag}</span>
          <h2>{resultView.kind === "instruction" ? resultView.instruction.projectName || resultTitle : resultTitle}</h2>
        </div>
        <span className="tag">{updateTag}</span>
      </div>

      <div className="project-cards">
        {resultView.kind === "waiting" ? (
          <WaitingCard concept={form.concept} interest={form.interest || "球星点球大战"} kit={kitLabel} duration={form.duration} />
        ) : null}

        {resultView.kind === "progress" ? (
          <ProgressCard
            view={resultView}
            concept={form.concept}
            interest={form.interest || "球星点球大战"}
            kit={kitLabel}
            duration={form.duration}
          />
        ) : null}

        {resultView.kind === "error" ? (
          <ErrorCard view={resultView} onRetry={() => void retryGenerate()} onRestart={() => void restartGenerate()} />
        ) : null}

        {resultView.kind === "instruction" ? (
          <InstructionView
            instruction={resultView.instruction}
            isRealGeneration={resultView.isRealGeneration}
            generateCount={generateCount}
            concept={form.concept}
            onSave={() => handleSave(resultView.instruction)}
            onRegenerate={handleRegenerate}
            onExport={() => handleExport(resultView.instruction)}
            onShare={handleShare}
            saveLabel={saveFlash ? "已收藏" : "⭐ 收藏此方案"}
            saveDisabled={saveFlash}
          />
        ) : null}
      </div>
    </section>
  );
}
