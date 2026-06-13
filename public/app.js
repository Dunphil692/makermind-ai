// ==============================
// MakerMind AI - Frontend Logic
// 只在点击“生成硬件项目”时调用 AI
// 切换兴趣 / 时长 / 套件 / 知识点不会自动调用 AI
// ==============================

const form = document.getElementById("projectForm");
const conceptInput = document.getElementById("conceptInput");
const subjectSelect = document.getElementById("subjectSelect");
const levelSelect = document.getElementById("levelSelect");
const kitSelect = document.getElementById("kitSelect");
const durationSelect = document.getElementById("durationSelect");
const interestChips = document.getElementById("interestChips");
const projectCards = document.getElementById("projectCards");
const resultTitle = document.getElementById("resultTitle");
const matchTag = document.getElementById("matchTag");

let activeInterest = document.querySelector(".chip.active")?.dataset.interest || "游戏";

const kitMaterials = {
  arduino:
    "ESP32、Arduino、LED灯带、按钮、蜂鸣器、舵机、超声波传感器、OLED屏、纸板、杜邦线、面包板",

  k10:
    "UNIHIKER K10，内置屏幕、按键、温湿度传感器、陀螺仪、麦克风、扬声器；优先生成免接线、快速完成、适合课堂展示的硬件项目",

  microbit:
    "micro:bit、内置按钮、LED点阵、加速度传感器、蜂鸣器、扩展板、纸板、鳄鱼夹、简单外接传感器",

  paper:
    "卡纸、铜箔胶带、LED、纽扣电池、导电胶带、纸板、贴纸；优先生成无需复杂代码的纸电路项目",

  mixed:
    "纸板、电子模块、按钮、LED灯带、蜂鸣器、舵机、传感器、杜邦线、面包板；优先生成外观有趣、可快速搭建的互动装置"
};

const kitLabels = {
  arduino: "Arduino / ESP32 套件",
  k10: "UNIHIKER K10（免接线内置屏幕与传感器）",
  microbit: "micro:bit 套件",
  paper: "纸电路 / 无需编程",
  mixed: "纸板 + 电子模块"
};

const aiImageMap = {
  "reaction-trainer": {
    image: "assets/reaction-trainer.png",
    anchor: "reaction-trainer",
    caption: "真实场景风格的完成效果参考图，适合展示互动感和游戏感"
  },
  "character-energy-core": {
    image: "assets/character-energy-core.png",
    anchor: "character-energy-core",
    caption: "真实场景风格的完成效果参考图，适合展示角色设定和能量反馈"
  },
  "distance-radar": {
    image: "assets/distance-radar.png",
    anchor: "distance-radar",
    caption: "真实场景风格的完成效果参考图，适合展示数据映射和传感器反馈"
  },
  "rhythm-wall": {
    image: "assets/rhythm-wall.png",
    anchor: "rhythm-light-wall",
    caption: "真实场景风格的完成效果参考图，适合展示声音互动和灯效反馈"
  },
  "pet-house": {
    image: "assets/pet-house.png",
    anchor: "pet-comfort-house",
    caption: "真实场景风格的完成效果参考图，适合展示环境数据和故事感"
  },
  "pet-feeder": {
    image: "assets/pet-feeder.png",
    anchor: "pet-feeder",
    caption: "真实场景风格的完成效果参考图，适合展示投喂机构和状态判断"
  },
  "basketball-scoreboard": {
    image: "assets/basketball-scoreboard.png",
    anchor: "basketball-scoreboard",
    caption: "真实场景风格的完成效果参考图，适合展示计分与运动主题互动"
  },
  "livestream-dashboard": {
    image: "assets/livestream-dashboard.png",
    anchor: "livestream-dashboard",
    caption: "真实场景风格的完成效果参考图，适合展示社交媒体热度和数据反馈"
  },
  "milk-tea-console": {
    image: "assets/milk-tea-console.png",
    anchor: "milk-tea-console",
    caption: "真实场景风格的完成效果参考图，适合展示参数调节和生活化场景"
  }
};

function safeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSelectedText(selectElement) {
  if (!selectElement) return "";
  return selectElement.options[selectElement.selectedIndex]?.text || selectElement.value;
}

function getCurrentConcept() {
  return conceptInput?.value.trim() || "当前知识点";
}

function getCurrentSubject() {
  return subjectSelect?.value || "数学";
}

function getCurrentLevel() {
  return getSelectedText(levelSelect) || "需要项目带着学";
}

function getCurrentKitValue() {
  return kitSelect?.value || "arduino";
}

function getCurrentKitLabel() {
  const value = getCurrentKitValue();
  return kitLabels[value] || getSelectedText(kitSelect) || "Arduino / ESP32 套件";
}

function getCurrentDuration() {
  return durationSelect?.value || "60 分钟完成版";
}

function getCurrentMaterials() {
  const value = getCurrentKitValue();
  return kitMaterials[value] || kitMaterials.arduino;
}

function getAIProjectMedia(imageKey) {
  return aiImageMap[imageKey] || aiImageMap["reaction-trainer"];
}

function updateResultHeaderOnly() {
  if (resultTitle) {
    resultTitle.textContent = `${activeInterest}主题：${getCurrentConcept()}硬件项目`;
  }

  if (matchTag) {
    matchTag.textContent = "等待点击生成";
  }
}

function renderWaitingState() {
  if (!projectCards) return;

  projectCards.innerHTML = `
    <article class="project-card">
      <h3>等待生成项目</h3>
      <p>请先选择知识点、学生状态、硬件套件和兴趣偏向，然后点击左侧“生成硬件项目”</p>
      <p>切换选项不会自动消耗 AI token，只有点击生成按钮才会调用 AI</p>
    </article>
  `;
}

function renderLoadingState() {
  if (!projectCards) return;

  projectCards.innerHTML = `
    <article class="project-card">
      <h3>正在生成项目方案</h3>
      <p>AI 正在根据知识点、学生兴趣、硬件套件和可用材料生成 3 个硬件项目</p>
      <p>请稍等几秒，不要重复点击按钮</p>
    </article>
  `;
}

function renderErrorState(message) {
  if (!projectCards) return;

  projectCards.innerHTML = `
    <article class="project-card">
      <h3>AI 生成暂时失败</h3>
      <p><strong>错误信息：</strong>${safeText(message)}</p>
      <p>可以检查 AI_MODEL、AI_API_KEY、AI_BASE_URL 是否正确，或者稍后重新点击生成</p>
    </article>
  `;
}

function renderProjects(projects) {
  if (!projectCards) return;

  projectCards.innerHTML = "";

  projects.forEach((project, index) => {
    const media = getAIProjectMedia(project.imageKey);
    const materials = Array.isArray(project.materials) ? project.materials : [];
    const steps = Array.isArray(project.steps) ? project.steps : [];

    const card = document.createElement("article");
    card.className = "project-card";
    card.style.animationDelay = `${index * 70}ms`;

    card.innerHTML = `
      <div class="project-media">
        <img src="${media.image}" alt="${safeText(project.title || "硬件项目")} 最终效果参考图" />
        <div class="project-media-note">
          <strong>最终效果参考</strong>
          <span>${safeText(media.caption)}</span>
        </div>
      </div>

      <div class="project-card-header">
        <h3>${safeText(project.title || "未命名硬件项目")}</h3>
        <span class="badge">${safeText(project.difficulty || "中等")}</span>
      </div>

      <p>
        <strong>项目核心：</strong>
        ${safeText(project.summary || "AI 已生成一个与知识点相关的硬件项目")}
      </p>

      <div class="project-mini-meta">
        <div>
          <span>学科</span>
          <strong>${safeText(getCurrentSubject())}</strong>
        </div>
        <div>
          <span>套件</span>
          <strong>${safeText(getCurrentKitLabel())}</strong>
        </div>
        <div>
          <span>兴趣</span>
          <strong>${safeText(activeInterest)}</strong>
        </div>
        <div>
          <span>时长</span>
          <strong>${safeText(getCurrentDuration())}</strong>
        </div>
      </div>

      <p><strong>材料清单：</strong></p>
      <div class="mini-list">
        ${
          materials.length
            ? materials.map(item => `<span>${safeText(item)}</span>`).join("")
            : `<span>${safeText(getCurrentMaterials())}</span>`
        }
      </div>

      <div class="challenge-row">
        <div>
          <span>知识点落点</span>
          <strong>${safeText(project.knowledgePoint || getCurrentConcept())}</strong>
        </div>
        <div>
          <span>进阶挑战</span>
          <strong>${safeText(project.challenge || "增加一个可调参数并观察结果变化")}</strong>
        </div>
        <div>
          <span>图片匹配</span>
          <strong>${safeText(project.imageKey || "reaction-trainer")}</strong>
        </div>
        <div>
          <span>老师观察点</span>
          <strong>能否解释输入、规则和输出之间的关系</strong>
        </div>
      </div>

      <p><strong>建议流程：</strong></p>
      <ol>
        ${
          steps.length
            ? steps.map(step => `<li>${safeText(step)}</li>`).join("")
            : `
              <li>确认项目目标和硬件输入输出</li>
              <li>完成最小可运行版本</li>
              <li>修改一个参数并观察结果变化</li>
              <li>用自己的话解释作品和知识点的关系</li>
            `
        }
      </ol>

      <div class="project-actions">
        <a class="btn small primary" href="gallery.html#${media.anchor}">查看真实效果</a>
        <a class="btn small ghost" href="students.html">匹配学生画像</a>
        <a class="btn small ghost" href="rules.html">查看项目门槛</a>
      </div>
    `;

    projectCards.appendChild(card);
  });
}

async function generateProjects() {
  if (!projectCards) return;

  const submitButton = form?.querySelector('button[type="submit"]');

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "AI 生成中";
  }

  if (matchTag) {
    matchTag.textContent = "AI 生成中";
  }

  if (resultTitle) {
    resultTitle.textContent = `${activeInterest}主题：${getCurrentConcept()}硬件项目`;
  }

  renderLoadingState();

  try {
    const response = await fetch("/api/generate-projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        concept: getCurrentConcept(),
        subject: getCurrentSubject(),
        level: getCurrentLevel(),
        interest: activeInterest,
        kit: getCurrentKitLabel(),
        duration: getCurrentDuration(),
        materials: getCurrentMaterials()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.detail || "AI 请求失败");
    }

    if (!Array.isArray(data.projects)) {
      throw new Error("AI 没有返回 projects 数组");
    }

    if (matchTag) {
      matchTag.textContent = `AI 已生成 ${data.projects.length} 个项目`;
    }

    renderProjects(data.projects);
  } catch (error) {
    console.error(error);

    if (matchTag) {
      matchTag.textContent = "生成失败";
    }

    renderErrorState(error.message);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "生成硬件项目";
    }
  }
}

// ==============================
// Event listeners for generator page
// ==============================

if (interestChips) {
  interestChips.addEventListener("click", event => {
    const chip = event.target.closest(".chip");
    if (!chip) return;

    document.querySelectorAll(".chip").forEach(item => {
      item.classList.remove("active");
    });

    chip.classList.add("active");
    activeInterest = chip.dataset.interest || "游戏";

    updateResultHeaderOnly();
  });
}

[conceptInput, subjectSelect, levelSelect, kitSelect, durationSelect].forEach(input => {
  if (!input) return;

  const eventName = input.tagName === "INPUT" ? "input" : "change";

  input.addEventListener(eventName, () => {
    updateResultHeaderOnly();
  });
});

if (form) {
  form.addEventListener("submit", event => {
    event.preventDefault();
    generateProjects();
  });
}

if (projectCards) {
  updateResultHeaderOnly();
  renderWaitingState();
}

// ==============================
// Student profile page logic
// ==============================

const studentButtons = document.querySelectorAll(".student");
const studentName = document.getElementById("studentName");
const studentLevel = document.getElementById("studentLevel");
const studentInterests = document.getElementById("studentInterests");
const studentRisk = document.getElementById("studentRisk");
const teacherSuggestion = document.getElementById("teacherSuggestion");

const suggestions = {
  "林一鸣":
    "推荐用反应训练舱、投篮数据训练台或直播热度仪表盘作为入口。先让学生做出可玩的反馈，再要求他解释参数变化怎样影响分数、速度或灯效",
  "陈小雨":
    "推荐给她开放式挑战，比如角色能量核心、距离感应雷达或奶茶配方调参台。基础版本完成后，让她优化规则、增加模式并解释设计原因",
  "周可":
    "推荐先用节奏采样灯墙、直播热度仪表盘或奶茶配方调参台。前 10 分钟必须让作品有明显反馈，再慢慢把现象和知识点连接起来"
};

studentButtons.forEach(button => {
  button.addEventListener("click", () => {
    studentButtons.forEach(item => item.classList.remove("active"));
    button.classList.add("active");

    const name = button.dataset.name || "";
    const level = button.dataset.level || "";
    const interests = button.dataset.interests || "";
    const risk = button.dataset.risk || "";

    if (studentName) studentName.textContent = name;
    if (studentLevel) studentLevel.textContent = level;
    if (studentInterests) studentInterests.textContent = interests;
    if (studentRisk) studentRisk.textContent = risk;
    if (teacherSuggestion) {
      teacherSuggestion.textContent =
        suggestions[name] ||
        "推荐选择一个反馈明显、材料简单、能够在一小时内完成的硬件项目，再让学生解释作品和知识点之间的关系";
    }
  });
});