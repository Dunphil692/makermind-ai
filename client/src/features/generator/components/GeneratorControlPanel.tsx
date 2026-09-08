import { type FormEvent, useEffect, useRef } from "react";
import { AI_FEATURES_PAUSED, AI_FEATURES_PAUSED_MESSAGE } from "../../../config";
import { conceptSuggestions, interestChips, presetChips, quickReplies } from "../constants";
import type { DialogueMessage } from "../types";
import type { useGenerator } from "../useGenerator";

type GeneratorApi = ReturnType<typeof useGenerator>;

interface GeneratorControlPanelProps {
  api: GeneratorApi;
}

function DialogueWelcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="chat-welcome">
      <div className="chat-welcome-icon">💬</div>
      <h4>开始和 AI 一起备课吧</h4>
      <p>告诉 AI 你的课堂想法，比如学生喜欢什么、想用什么材料、要学什么知识。AI 会像备课助手一样帮你整理需求。</p>
      <div className="chat-quick-replies">
        {quickReplies.map((item) => (
          <button key={item.label} type="button" className="quick-reply-chip" onClick={() => onPick(item.text)}>
            {item.emoji} {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatThread({
  messages,
  thinking,
  onPickQuickReply
}: {
  messages: DialogueMessage[];
  thinking: boolean;
  onPickQuickReply: (text: string) => void;
}) {
  if (messages.length === 0) return <DialogueWelcome onPick={onPickQuickReply} />;

  return (
    <>
      {messages.map((message, index) => (
        <div key={`${message.role}-${index}`} className={`chat-message ${message.role === "user" ? "user" : "assistant"}`}>
          <span>{message.role === "user" ? "老师" : "AI"}</span>
          <p>{message.content}</p>
        </div>
      ))}
      {thinking ? (
        <div className="chat-message assistant chat-thinking">
          <span>AI</span>
          <p>
            <span className="typing-dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>{" "}
            正在整理课堂需求
          </p>
        </div>
      ) : null}
    </>
  );
}

export function GeneratorControlPanel({ api }: GeneratorControlPanelProps) {
  const chatRef = useRef<HTMLDivElement>(null);
  const {
    form,
    updateForm,
    briefItems,
    dialogueMessages,
    dialogueInput,
    setDialogueInput,
    isDialogueThinking,
    sendDialogueMessage,
    generateDisabled,
    generateLabel,
    generate,
    isGenerating,
    students,
    selectedStudentId,
    setSelectedStudentId,
    applyPreset,
    setHistoryOpen,
    setSavedOpen
  } = api;

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [dialogueMessages, isDialogueThinking]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!AI_FEATURES_PAUSED && !generateDisabled) void generate();
  }

  return (
    <form className="control-panel generator-control-panel" onSubmit={onSubmit}>
      <div className="form-section-title">
        <span>AI CHAT INTAKE</span>
        <h2>和 AI 一起备课</h2>
        <p>像聊天一样告诉 AI 课堂想法，系统会先了解学生兴趣、硬件条件和学习目标，再生成完整项目方案。</p>
      </div>

      {AI_FEATURES_PAUSED ? (
        <div className="tips-box" role="status">
          <strong>{AI_FEATURES_PAUSED_MESSAGE}</strong>
          <p>MakerMind AI 的模型调用目前已暂停。已有方案、历史记录和收藏仍可正常查看。</p>
        </div>
      ) : null}

      <div className="chat-generator-panel">
        {students.length > 0 ? (
          <label className="auth-field">
            为某个学生生成（可选）
            <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
              <option value="">不指定学生画像</option>
              {students.map((s) => (
                <option key={s.studentId} value={s.studentId}>
                  {s.name}
                  {s.interestDirection
                    ? ` · ${Array.isArray(s.interestDirection) ? s.interestDirection.join("/") : s.interestDirection}`
                    : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="chat-thread" aria-live="polite" ref={chatRef}>
          <ChatThread
            messages={dialogueMessages}
            thinking={isDialogueThinking}
            onPickQuickReply={setDialogueInput}
          />
        </div>

        <div className="brief-status" aria-label="任务简报状态">
          {briefItems.map((item) => (
            <div key={item.key} className={`brief-chip ${item.complete ? "complete" : "missing"}`}>
              <span>{item.label}</span>
              <strong>{item.value || "待了解"}</strong>
            </div>
          ))}
        </div>

        <div className="chat-input-row">
          <textarea
            className="dialogue-input"
            rows={3}
            placeholder="例如：我们班学生喜欢足球点球，我想用 K10，让他们学一次函数。"
            value={dialogueInput}
            disabled={AI_FEATURES_PAUSED}
            onChange={(e) => setDialogueInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendDialogueMessage();
              }
            }}
          />
          <button type="button" className="btn primary small" disabled={AI_FEATURES_PAUSED || isDialogueThinking} onClick={() => void sendDialogueMessage()}>
            {AI_FEATURES_PAUSED ? "已暂停" : "发送"}
          </button>
        </div>

        <button className={`btn primary wide${isGenerating ? " loading" : ""}`} type="submit" disabled={generateDisabled}>
          <span className="btn-icon">{generateDisabled && !isGenerating ? "💬" : "⚡"}</span>
          {generateLabel}
        </button>
      </div>

      <details className="advanced-generator-fields">
        <summary>高级参数 / 自动填充字段</summary>
        <div className="advanced-fields-grid">
          <label>
            知识点
            <input
              type="text"
              list="conceptSuggestions"
              placeholder="输入知识点，如：一次函数、勾股定理..."
              value={form.concept}
              onChange={(e) => updateForm({ concept: e.target.value })}
            />
            <datalist id="conceptSuggestions">
              {conceptSuggestions.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </label>

          <label>
            学科方向
            <select value={form.subject} onChange={(e) => updateForm({ subject: e.target.value })}>
              <option value="数学">数学</option>
              <option value="科学">科学</option>
              <option value="物理">物理</option>
              <option value="信息技术">信息技术</option>
              <option value="综合实践">综合实践</option>
            </select>
          </label>

          <label>
            学生学习状态
            <select value={form.level} onChange={(e) => updateForm({ level: e.target.value })}>
              <option value="需要项目带着学">需要项目带着学</option>
              <option value="理解快，需要挑战">理解快，需要挑战</option>
              <option value="兴趣低，需要强反馈">兴趣低，需要强反馈</option>
            </select>
          </label>

          <label>
            兴趣场景
            <input
              type="text"
              className="interest-input"
              placeholder="输入你感兴趣的场景，如：无人机、智能家居、太空探索…"
              value={form.interest}
              onChange={(e) => updateForm({ interest: e.target.value })}
              autoComplete="off"
            />
            <div className="interest-hint">AI 对话会自动填充，也可以在这里手动修正。</div>
            <div className="chips">
              {interestChips.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={`chip${form.interest === interest ? " active" : ""}`}
                  onClick={() => updateForm({ interest })}
                >
                  {interest}
                </button>
              ))}
            </div>
          </label>

          <label>
            硬件套件
            <select value={form.kit} onChange={(e) => updateForm({ kit: e.target.value })}>
              <option value="k10">UNIHIKER K10（推荐）</option>
              <option value="arduino">Arduino / ESP32</option>
              <option value="microbit">micro:bit</option>
              <option value="paper">纸电路 / 无需编程</option>
              <option value="mixed">纸板 + 电子模块</option>
            </select>
          </label>

          <label>
            课堂时长
            <select value={form.duration} onChange={(e) => updateForm({ duration: e.target.value })}>
              <option value="15 分钟快速体验">15 分钟快速体验</option>
              <option value="30 分钟小任务">30 分钟小任务</option>
              <option value="45 分钟课堂活动">45 分钟课堂活动</option>
              <option value="60 分钟项目课">60 分钟项目课</option>
            </select>
          </label>
        </div>
      </details>

      <div className="quick-presets">
        <h5>💡 一键示例，也可以直接发给 AI</h5>
        <p className="preset-help">点击后会填充对话和参数，便于快速演示。</p>
        <div className="preset-chips">
          {presetChips.map((preset) => (
            <button key={preset.label} type="button" className="preset-chip" onClick={() => applyPreset(preset)}>
              {preset.emoji} {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="generator-actions-row">
        <button type="button" className="btn ghost small" onClick={() => setHistoryOpen(true)}>
          历史记录
        </button>
        <button type="button" className="btn ghost small" onClick={() => setSavedOpen(true)}>
          已收藏
        </button>
      </div>

      <div className="generator-tips">
        <h4>💡 使用提示</h4>
        <ul>
          <li>
            <strong>直接描述：</strong>告诉 AI 学生喜欢什么、想用什么硬件、要学什么知识。
          </li>
          <li>
            <strong>逐步补充：</strong>如果信息不完整，AI 会像备课助手一样追问。
          </li>
          <li>
            <strong>自动生成：</strong>信息完整后点击生成，系统仍会分三段生成完整方案。
          </li>
        </ul>
        <p className="generator-note">对话只负责收集需求，最终 project 仍使用原来的高质量生成和展示样式。</p>
      </div>
    </form>
  );
}
