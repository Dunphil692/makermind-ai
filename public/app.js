const form = document.getElementById("projectForm");
const conceptInput = document.getElementById("conceptInput");
const subjectSelect = document.getElementById("subjectSelect");
const levelSelect = document.getElementById("levelSelect");
const kitSelect = document.getElementById("kitSelect");
const durationSelect = document.getElementById("durationSelect");
const projectCards = document.getElementById("projectCards");
const resultTitle = document.getElementById("resultTitle");
const matchTag = document.getElementById("matchTag");
const chips = document.querySelectorAll(".chip");

let activeInterest = "游戏";
let isGenerating = false;

const imageLibrary = {
  "reaction-trainer": {
    images: [
      "/assets/reference/reaction-trainer-01.png",
      "/assets/reference/reaction-trainer-02.png",
      "/assets/reference/reaction-trainer-03.png",
      "/assets/reference/reaction-trainer-04.png",
      "/assets/reaction-trainer.png"
    ],
    title: "项目效果参考",
    caption: "互动反应、计时挑战、按钮反馈和游戏得分"
  },
  "distance-radar": {
    images: [
      "/assets/reference/distance-radar-01.png",
      "/assets/reference/distance-radar-02.png",
      "/assets/reference/distance-radar-03.png",
      "/assets/reference/distance-radar-04.png",
      "/assets/distance-radar.png"
    ],
    title: "项目效果参考",
    caption: "距离测量、数据映射、传感器反馈和角度变化"
  },
  "rhythm-wall": {
    images: [
      "/assets/reference/rhythm-wall-01.png",
      "/assets/reference/rhythm-wall-02.png",
      "/assets/reference/rhythm-wall-03.png",
      "/assets/reference/rhythm-wall-04.png",
      "/assets/rhythm-wall.png"
    ],
    title: "项目效果参考",
    caption: "音乐节奏、声音互动、灯光变化和速度挑战"
  },
  "pet-house": {
    images: [
      "/assets/reference/pet-house-01.png",
      "/assets/reference/pet-house-02.png",
      "/assets/reference/pet-house-03.png",
      "/assets/pet-house.png"
    ],
    title: "项目效果参考",
    caption: "宠物照护、环境监测、温湿度反馈和生活场景"
  },
  "pet-feeder": {
    images: [
      "/assets/reference/pet-feeder-01.png",
      "/assets/reference/pet-feeder-02.png",
      "/assets/reference/pet-feeder-03.png",
      "/assets/pet-feeder.png"
    ],
    title: "项目效果参考",
    caption: "自动投喂、定时控制、余量检测和小管家系统"
  },
  "basketball-scoreboard": {
    images: [
      "/assets/reference/basketball-scoreboard-01.png",
      "/assets/reference/basketball-scoreboard-02.png",
      "/assets/reference/basketball-scoreboard-03.png",
      "/assets/basketball-scoreboard.png"
    ],
    title: "项目效果参考",
    caption: "运动计分、比赛规则、倒计时和数据统计"
  },
  "livestream-dashboard": {
    images: [
      "/assets/reference/livestream-dashboard-01.png",
      "/assets/reference/livestream-dashboard-02.png",
      "/assets/reference/livestream-dashboard-03.png",
      "/assets/livestream-dashboard.png"
    ],
    title: "项目效果参考",
    caption: "直播热度、实时数据、趋势变化和可视化看板"
  },
  "milk-tea-console": {
    images: [
      "/assets/reference/milk-tea-console-01.png",
      "/assets/reference/milk-tea-console-02.png",
      "/assets/reference/milk-tea-console-03.png",
      "/assets/milk-tea-console.png"
    ],
    title: "项目效果参考",
    caption: "配方比例、参数调节、旋钮输入和比例变化"
  },
  "character-energy-core": {
    images: [
      "/assets/reference/character-energy-core-01.png",
      "/assets/reference/character-energy-core-02.png",
      "/assets/reference/character-energy-core-03.png",
      "/assets/character-energy-core.png"
    ],
    title: "项目效果参考",
    caption: "角色成长、能量数值、等级变化和灯光反馈"
  }
};

const kitMaterials = {
  arduino:
    "ESP32、Arduino、LED灯带、按钮、蜂鸣器、舵机、超声波传感器、OLED屏、纸板、杜邦线、面包板",
  microbit:
    "micro:bit 主板、LED灯、按钮、蜂鸣器、舵机、纸板、鳄鱼夹、扩展板、传感器模块",
  paper:
    "铜箔胶带、纽扣电池、LED灯、纸板、彩纸、导电胶带、开关贴片、马克笔",
  mixed:
    "纸板、亚克力片、LED灯带、按钮、蜂鸣器、舵机、传感器模块、杜邦线、热熔胶",
  k10:
    "UNIHIKER K10，内置屏幕、按键、温湿度传感器、光敏传感器、加速度传感器、麦克风、扬声器、RGB LED；优先生成免接线、快速完成、适合课堂展示的硬件项目"
};

const kitLabels = {
  arduino: "Arduino / ESP32 套件",
  microbit: "micro:bit 套件",
  paper: "纸电路 / 无需编程",
  mixed: "纸板 + 电子模块",
  k10: "UNIHIKER K10"
};

function safeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSelectedText(selectElement) {
  if (!selectElement) return "";
  return selectElement.options[selectElement.selectedIndex]?.text || selectElement.value || "";
}

function getCurrentConcept() {
  return conceptInput?.value.trim() || "当前知识点";
}

function getCurrentSubject() {
  return subjectSelect?.value || "数学";
}

function getCurrentDuration() {
  return durationSelect?.value || "60 分钟完成版";
}

function getCurrentKitValue() {
  return kitSelect?.value || "arduino";
}

function getCurrentKitLabel() {
  const value = getCurrentKitValue();
  return kitLabels[value] || getSelectedText(kitSelect) || "Arduino / ESP32 套件";
}

function getCurrentMaterials() {
  const value = getCurrentKitValue();
  return kitMaterials[value] || kitMaterials.arduino;
}

function updateResultHeaderOnly() {
  if (!resultTitle || !matchTag) return;

  resultTitle.textContent = `${activeInterest}主题：${getCurrentConcept()}学习 instruction`;
  matchTag.textContent = "等待点击生成";
}

function renderWaitingState() {
  if (!projectCards) return;

  projectCards.innerHTML = `
    <article class="instruction-empty">
      <div class="project-card-header">
        <h4>等待生成 instruction</h4>
        <span class="badge">未调用 AI</span>
      </div>
      <p>
        现在切换兴趣、课堂时长、硬件套件都不会消耗 token。
        只有点击“生成硬件项目”按钮，才会生成完整学习 instruction。
      </p>
      <div class="project-meta">
        <div><span>当前知识点</span><strong>${safeText(getCurrentConcept())}</strong></div>
        <div><span>兴趣</span><strong>${safeText(activeInterest)}</strong></div>
        <div><span>套件</span><strong>${safeText(getCurrentKitLabel())}</strong></div>
        <div><span>时长</span><strong>${safeText(getCurrentDuration())}</strong></div>
      </div>
    </article>
  `;
}

function renderLoadingState() {
  if (!projectCards || !resultTitle || !matchTag) return;

  resultTitle.textContent = `${activeInterest}主题：${getCurrentConcept()}学习 instruction`;
  matchTag.textContent = "AI 生成中";

  projectCards.innerHTML = `
    <article class="instruction-empty">
      <div class="project-card-header">
        <h4>正在生成完整项目 instruction...</h4>
        <span class="badge">AI 思考中</span>
      </div>
      <p>正在生成项目概述、材料清单、制作步骤、知识讲解、融会贯通训练和常见问题。</p>
      <div class="project-meta">
        <div><span>知识点</span><strong>${safeText(getCurrentConcept())}</strong></div>
        <div><span>兴趣</span><strong>${safeText(activeInterest)}</strong></div>
        <div><span>套件</span><strong>${safeText(getCurrentKitLabel())}</strong></div>
        <div><span>时长</span><strong>${safeText(getCurrentDuration())}</strong></div>
      </div>
    </article>
  `;
}

function renderErrorState(message) {
  if (!projectCards || !matchTag) return;

  matchTag.textContent = "生成失败";

  projectCards.innerHTML = `
    <article class="instruction-empty error-card">
      <div class="project-card-header">
        <h4>AI 生成暂时失败</h4>
        <span class="badge">失败</span>
      </div>
      <p><strong>错误信息：</strong>${safeText(message)}</p>
      <p>可以稍后重新点击生成，或检查 AI_MODEL、AI_API_KEY、AI_BASE_URL 是否正确。</p>
    </article>
  `;
}

function getStableImageIndex(instruction, imageCount) {
  const source = `${instruction.imageKey}-${instruction.projectName}-${instruction.subtitle}`;
  let hash = 0;

  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }

  return imageCount > 0 ? hash % imageCount : 0;
}

function getImageInfo(instruction) {
  const key = instruction.imageKey || "reaction-trainer";
  const libraryItem = imageLibrary[key] || imageLibrary["reaction-trainer"];
  const images = Array.isArray(libraryItem.images) ? libraryItem.images : [];
  const index = getStableImageIndex(instruction, images.length);
  const selectedImage = images[index] || "/assets/reaction-trainer.png";

  return {
    image: selectedImage,
    title: libraryItem.title,
    caption: libraryItem.caption
  };
}


async function requestInstructionPart(payload, part) {
  const response = await fetch("/api/generate-instruction-part", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...payload,
      part
    })
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`接口返回的不是 JSON：${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(data.detail || data.error || `${part} 生成失败`);
  }

  if (!data.data) {
    throw new Error(`AI 没有返回 ${part} 数据`);
  }

  return data.data;
}

function renderGenerationProgress(step, total, title, description) {
  if (!projectCards || !resultTitle || !matchTag) {
    return;
  }

  resultTitle.textContent = `${activeInterest}主题：${getCurrentConcept()}学习 instruction`;
  matchTag.textContent = `生成中 ${step}/${total}`;

  projectCards.innerHTML = `
    <article class="instruction-empty">
      <div class="project-card-header">
        <h4>${safeText(title)}</h4>
        <span class="badge">${safeText(step)} / ${safeText(total)}</span>
      </div>
      <p>${safeText(description)}</p>
      <div class="project-meta">
        <div><span>知识点</span><strong>${safeText(getCurrentConcept())}</strong></div>
        <div><span>兴趣</span><strong>${safeText(activeInterest)}</strong></div>
        <div><span>套件</span><strong>${safeText(getCurrentKitLabel())}</strong></div>
        <div><span>时长</span><strong>${safeText(getCurrentDuration())}</strong></div>
      </div>
      <div class="tips-box">
        内容正在分段生成。这样等待时间可能仍然较长，但比一次性生成稳定很多，请不要关闭页面。
      </div>
    </article>
  `;
}

function mergeInstructionParts(overview, build, practice) {
  return {
    projectName: overview.projectName,
    subtitle: overview.subtitle,
    imageKey: overview.imageKey,
    meta: overview.meta,
    overview: overview.overview,
    interactionFlow: overview.interactionFlow,
    materials: overview.materials,

    steps: build.steps,
    knowledgeExplanation: build.knowledgeExplanation,
    starterCode: build.starterCode,

    masteryTraining: practice.masteryTraining,
    extensions: practice.extensions,
    faq: practice.faq
  };
}

async function generateProjects() {
  if (isGenerating) {
    return;
  }

  isGenerating = true;

  const submitButton = form?.querySelector("button[type='submit']");
  const originalButtonText = submitButton?.textContent || "生成硬件项目";

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "正在生成 1/3...";
  }

  try {
    const payload = {
      concept: getCurrentConcept(),
      subject: getCurrentSubject(),
      level: getSelectedText(levelSelect),
      interest: activeInterest,
      kit: getCurrentKitLabel(),
      duration: getCurrentDuration(),
      materials: getCurrentMaterials()
    };

    renderGenerationProgress(
      1,
      3,
      "正在生成 1/3：项目概述与交互设计",
      "正在生成项目标题、学习目标、交互流程和材料清单。"
    );

    const overview = await requestInstructionPart(payload, "overview");

    if (submitButton) {
      submitButton.textContent = "正在生成 2/3...";
    }

    renderGenerationProgress(
      2,
      3,
      "正在生成 2/3：制作步骤与知识讲解",
      "正在生成详细制作步骤、知识点讲解和代码思路。"
    );

    const build = await requestInstructionPart(payload, "build");

    if (submitButton) {
      submitButton.textContent = "正在生成 3/3...";
    }

    renderGenerationProgress(
      3,
      3,
      "正在生成 3/3：融会贯通训练与 FAQ",
      "正在生成基础练习、变化挑战、逆向思维、进阶方向和常见问题。"
    );

    const practice = await requestInstructionPart(payload, "practice");

    const instruction = mergeInstructionParts(overview, build, practice);
    renderInstruction(instruction);
  } catch (error) {
    console.error(error);
    renderErrorState(error.message || "Failed to fetch");
  } finally {
    isGenerating = false;

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}




function formatStarterCode(value) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderInstruction(instruction) {
  if (!projectCards || !resultTitle || !matchTag) return;

  const imageInfo = getImageInfo(instruction);

  resultTitle.textContent = instruction.projectName || `${getCurrentConcept()}学习 instruction`;
  matchTag.textContent = "完整 instruction";

  projectCards.innerHTML = `
    <article class="instruction-doc">
      <header class="instruction-hero">
        <div>
          <p class="instruction-kicker">STEAM 项目指导</p>
          <h2>${safeText(instruction.projectName)}</h2>
          <p>${safeText(instruction.subtitle)}</p>
          <div class="instruction-meta">
            <span>状态：${safeText(instruction.meta?.studentLevel)}</span>
            <span>知识点：${safeText(instruction.meta?.knowledgePoint)}</span>
            <span>时长：${safeText(instruction.meta?.timeRequired)}</span>
            <span>硬件：${safeText(instruction.meta?.hardware)}</span>
          </div>
        </div>
      </header>

      <figure class="instruction-visual">
        <img src="${safeText(imageInfo.image)}" alt="${safeText(instruction.projectName)}" loading="lazy">
        <figcaption>
          <strong>${safeText(imageInfo.title)}</strong>
          <span>${safeText(imageInfo.caption)}</span>
        </figcaption>
      </figure>

      <section class="instruction-section">
        <h3>📖 项目概述</h3>
        <div class="highlight-box">
          <strong>核心目标：</strong>${safeText(instruction.overview?.coreGoal)}
        </div>
        <p><strong>项目简介：</strong>${safeText(instruction.overview?.projectIntro)}</p>
        <p><strong>为什么学生会想玩：</strong>${safeText(instruction.overview?.whyFun)}</p>
        ${renderList("为什么这个项目能帮助学习", instruction.overview?.learningReasons)}
      </section>

      <section class="instruction-section">
        <h3>🎮 交互流程预览</h3>
        <div class="flow-grid">
          <div><span>触发</span><strong>${safeText(instruction.interactionFlow?.trigger)}</strong></div>
          <div><span>计算</span><strong>${safeText(instruction.interactionFlow?.calculation)}</strong></div>
          <div><span>等级</span><strong>${safeText(instruction.interactionFlow?.level)}</strong></div>
        </div>
        ${renderList("反馈方式", instruction.interactionFlow?.feedback)}
        <div class="tips-box">${safeText(instruction.interactionFlow?.levelReason)}</div>
      </section>

      <section class="instruction-section">
        <h3>🛠️ 材料清单</h3>
        ${renderMaterialsTable(instruction.materials)}
      </section>

      <section class="instruction-section">
        <h3>📋 制作步骤</h3>
        ${renderSteps(instruction.steps)}
      </section>

      <section class="instruction-section">
        <h3>📚 知识点讲解</h3>
        ${renderKnowledge(instruction.knowledgeExplanation)}
      </section>

      <section class="instruction-section mastery-block">
        <h3>🎯 融会贯通训练</h3>
        ${renderMastery(instruction.masteryTraining)}
      </section>

      <section class="instruction-section code-thought-section">
        <div class="code-section-title">
          <div>
            <h3>💻 代码思路</h3>
            <p>核心逻辑：读取输入 → 建立知识点规则 → 输出硬件反馈</p>
          </div>
          <button class="copy-code-btn" type="button" data-copy-code aria-label="复制代码">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="9" y="7" width="10" height="12" rx="2"></rect>
              <rect x="5" y="3" width="10" height="12" rx="2"></rect>
            </svg>
            <span>复制</span>
          </button>
        </div>

        <div class="code-copy-card">
          <div class="code-copy-header">
            <span class="code-dot red"></span>
            <span class="code-dot yellow"></span>
            <span class="code-dot green"></span>
            <strong>Starter Code / Pseudocode</strong>
          </div>
          <pre class="instruction-code"><code>${safeText(formatStarterCode(instruction.starterCode))}</code></pre>
        </div>
      </section>

      <section class="instruction-section">
        <h3>🚀 进阶方向</h3>
        ${renderList("", instruction.extensions)}
      </section>

      <section class="instruction-section">
        <h3>❓ 常见问题</h3>
        ${renderFaq(instruction.faq)}
      </section>
    </article>
  `;
}

function renderList(title, items) {
  const list = Array.isArray(items) ? items : [];

  if (!list.length) return "";

  return `
    ${title ? `<h4>${safeText(title)}</h4>` : ""}
    <ul>
      ${list.map(item => `<li>${safeText(item)}</li>`).join("")}
    </ul>
  `;
}

function renderMaterialsTable(materials) {
  const list = Array.isArray(materials) ? materials : [];

  if (!list.length) return "<p>暂无材料清单。</p>";

  return `
    <table class="instruction-table">
      <thead>
        <tr>
          <th>材料</th>
          <th>数量</th>
          <th>用途</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(item => `
          <tr>
            <td>${safeText(item.name)}</td>
            <td>${safeText(item.quantity)}</td>
            <td>${safeText(item.usage)}</td>
            <td>${safeText(item.note)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderSteps(steps) {
  const list = Array.isArray(steps) ? steps : [];

  if (!list.length) return "<p>暂无制作步骤。</p>";

  return list.map((step, index) => `
    <details ${index === 0 ? "open" : ""}>
      <summary>Step ${index + 1}: ${safeText(step.title)}（${safeText(step.duration)}）</summary>
      <div class="detail-content">
        <p>${safeText(step.content)}</p>
        ${step.tips ? `<div class="tips-box">💡 ${safeText(step.tips)}</div>` : ""}
        ${step.warning ? `<div class="warning-box">⚠️ ${safeText(step.warning)}</div>` : ""}
      </div>
    </details>
  `).join("");
}

function renderKnowledge(knowledge) {
  return `
    <details open>
      <summary>核心概念</summary>
      <div class="detail-content">
        <p>${safeText(knowledge?.coreConcept)}</p>
      </div>
    </details>

    <details>
      <summary>关键公式 / 规则</summary>
      <div class="detail-content">
        <div class="formula-box">${safeText(knowledge?.keyFormula)}</div>
      </div>
    </details>

    <details>
      <summary>在项目中的应用</summary>
      <div class="detail-content">
        <p>${safeText(knowledge?.inProject)}</p>
      </div>
    </details>

    <details>
      <summary>深入理解与常见误区</summary>
      <div class="detail-content">
        <p><strong>深入理解：</strong>${safeText(knowledge?.deepUnderstanding)}</p>
        <p><strong>常见误区：</strong>${safeText(knowledge?.commonMisunderstanding)}</p>
      </div>
    </details>
  `;
}

function renderMastery(training) {
  const items = [
    ["基础练习", training?.basicPractice],
    ["变化挑战", training?.variationChallenge],
    ["逆向思维", training?.reverseThinking],
    ["综合应用", training?.comprehensiveApplication],
    ["举一反三", training?.transferQuestion]
  ];

  return items.map(([title, item], index) => `
    <details ${index === 0 ? "open" : ""}>
      <summary>${safeText(title)}</summary>
      <div class="detail-content training-card">
        <p><strong>任务：</strong>${safeText(item?.task)}</p>
        <p><strong>提示：</strong>${safeText(item?.hint)}</p>
        <p><strong>参考答案：</strong>${safeText(item?.answer)}</p>
      </div>
    </details>
  `).join("");
}

function renderFaq(faq) {
  const list = Array.isArray(faq) ? faq : [];

  if (!list.length) return "<p>暂无常见问题。</p>";

  return list.map((item, index) => `
    <details>
      <summary>Q${index + 1}: ${safeText(item.question)}</summary>
      <div class="detail-content">
        <p>${safeText(item.answer)}</p>
      </div>
    </details>
  `).join("");
}

function injectInstructionStyles() {
  if (document.getElementById("instruction-style")) return;

  const style = document.createElement("style");
  style.id = "instruction-style";
  style.textContent = `
    .instruction-doc {
      background: #ffffff;
      border-radius: 28px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
    }

    .instruction-empty {
      background: #ffffff;
      border-radius: 24px;
      padding: 24px;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }

    .instruction-hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 34px;
    }

    .instruction-kicker {
      margin: 0 0 10px;
      opacity: 0.88;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .instruction-hero h2 {
      margin: 0 0 12px;
      font-size: clamp(32px, 5vw, 52px);
      line-height: 1.06;
    }

    .instruction-hero p {
      color: rgba(255,255,255,0.92);
      font-size: 18px;
    }

    .instruction-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }

    .instruction-meta span {
      background: rgba(255,255,255,0.18);
      padding: 8px 12px;
      border-radius: 999px;
      font-weight: 800;
      font-size: 13px;
    }

    .instruction-visual {
      margin: 0;
      background: #f8fafc;
    }

    .instruction-visual img {
      width: 100%;
      max-height: 360px;
      object-fit: cover;
      display: block;
    }

    .instruction-visual figcaption {
      padding: 14px 22px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: #475569;
      background: #f8fafc;
    }

    .instruction-section {
      padding: 28px 32px;
      border-top: 1px solid rgba(15, 23, 42, 0.08);
    }

    .instruction-section h3 {
      color: #4f46e5;
      font-size: 24px;
      margin: 0 0 18px;
    }

    .instruction-section h4 {
      margin: 18px 0 10px;
      color: #0f172a;
    }

    .instruction-section p,
    .instruction-section li {
      color: #334155;
      line-height: 1.75;
    }

    .highlight-box,
    .tips-box,
    .warning-box,
    .formula-box {
      border-radius: 16px;
      padding: 16px 18px;
      margin: 14px 0;
      line-height: 1.7;
    }

    .highlight-box {
      background: #eef2ff;
      border-left: 5px solid #6366f1;
    }

    .tips-box {
      background: #ecfeff;
      border-left: 5px solid #06b6d4;
      color: #0f766e;
    }

    .warning-box {
      background: #fff7ed;
      border-left: 5px solid #f97316;
      color: #9a3412;
    }

    .formula-box {
      background: #f8fafc;
      border: 2px dashed #6366f1;
      font-family: "Courier New", monospace;
      color: #4338ca;
      font-weight: 800;
      text-align: center;
      white-space: pre-wrap;
    }

    .flow-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .flow-grid div {
      background: #f8fafc;
      border-radius: 18px;
      padding: 16px;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }

    .flow-grid span {
      display: block;
      color: #64748b;
      font-size: 13px;
      margin-bottom: 8px;
    }

    .flow-grid strong {
      color: #0f172a;
      line-height: 1.55;
    }

    .instruction-table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border-radius: 16px;
      font-size: 14px;
    }

    .instruction-table th,
    .instruction-table td {
      padding: 12px;
      border: 1px solid #e2e8f0;
      text-align: left;
      vertical-align: top;
    }

    .instruction-table th {
      background: #6366f1;
      color: #ffffff;
    }

    details {
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      margin: 12px 0;
      background: #ffffff;
    }

    summary {
      cursor: pointer;
      padding: 16px 18px;
      background: #f8fafc;
      color: #4f46e5;
      font-weight: 900;
    }

    .detail-content {
      padding: 18px;
    }

    .mastery-block {
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
    }

    .training-card {
      background: #ffffff;
    }

    pre {
      background: #0f172a;
      color: #e2e8f0;
      padding: 20px;
      border-radius: 18px;
      overflow-x: auto;
      line-height: 1.6;
      font-size: 14px;
    }

    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }

    @media (max-width: 900px) {
      .flow-grid {
        grid-template-columns: 1fr;
      }

      .instruction-section {
        padding: 22px;
      }

      .instruction-table {
        font-size: 12px;
      }
    }
  `;

  document.head.appendChild(style);
}


async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

document.addEventListener("click", async event => {
  const button = event.target.closest("[data-copy-code]");
  if (!button) {
    return;
  }

  const section = button.closest(".code-thought-section");
  const code = section?.querySelector("code")?.textContent || "";

  if (!code.trim()) {
    return;
  }

  const label = button.querySelector("span");
  const oldText = label?.textContent || "复制";

  try {
    await copyTextToClipboard(code);
    if (label) label.textContent = "已复制";
    button.classList.add("copied");

    setTimeout(() => {
      if (label) label.textContent = oldText;
      button.classList.remove("copied");
    }, 1400);
  } catch (error) {
    console.error(error);
    if (label) label.textContent = "复制失败";
  }
});


chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(item => item.classList.remove("active"));
    chip.classList.add("active");
    activeInterest = chip.dataset.interest || chip.textContent.trim() || "游戏";

    updateResultHeaderOnly();
    renderWaitingState();
  });
});

if (form) {
  form.addEventListener("submit", event => {
    event.preventDefault();
    generateProjects();
  });
}

[conceptInput, subjectSelect, levelSelect, kitSelect, durationSelect].forEach(control => {
  if (!control) return;

  control.addEventListener("change", () => {
    updateResultHeaderOnly();
    renderWaitingState();
  });

  if (control === conceptInput) {
    control.addEventListener("input", () => {
      updateResultHeaderOnly();
      renderWaitingState();
    });
  }
});

const students = document.querySelectorAll(".student");
const studentName = document.getElementById("studentName");
const studentLevel = document.getElementById("studentLevel");
const studentInterests = document.getElementById("studentInterests");
const studentRisk = document.getElementById("studentRisk");
const teacherSuggestion = document.getElementById("teacherSuggestion");

const suggestions = {
  林一鸣: "推荐用“闯关、升级、角色成长”作为项目入口，把一次函数转化成等级、经验值、金币变化的规则。",
  陈小雨: "推荐给开放挑战，不要让她做太基础的项目。可以要求她反向设计规则，并证明为什么这个规则成立。",
  周可: "推荐先做能马上看到效果的项目，比如短视频数据分析或音乐节奏生成。先让她产生参与感，再回到知识点总结。"
};

students.forEach(button => {
  button.addEventListener("click", () => {
    students.forEach(item => item.classList.remove("active"));
    button.classList.add("active");

    if (studentName) studentName.textContent = button.dataset.name;
    if (studentLevel) studentLevel.textContent = button.dataset.level;
    if (studentInterests) studentInterests.textContent = button.dataset.interests;
    if (studentRisk) studentRisk.textContent = button.dataset.risk;
    if (teacherSuggestion) teacherSuggestion.textContent = suggestions[button.dataset.name];
  });
});

injectInstructionStyles();
updateResultHeaderOnly();
renderWaitingState();