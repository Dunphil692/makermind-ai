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
    title: "最终效果参考",
    caption: "适合展示互动反应、计时挑战、按钮反馈和游戏得分"
  },

  "distance-radar": {
    images: [
      "/assets/reference/distance-radar-01.png",
      "/assets/reference/distance-radar-02.png",
      "/assets/reference/distance-radar-03.png",
      "/assets/reference/distance-radar-04.png",
      "/assets/distance-radar.png"
    ],
    title: "最终效果参考",
    caption: "适合展示距离测量、数据映射、传感器反馈和角度变化"
  },

  "rhythm-wall": {
    images: [
      "/assets/reference/rhythm-wall-01.png",
      "/assets/reference/rhythm-wall-02.png",
      "/assets/reference/rhythm-wall-03.png",
      "/assets/reference/rhythm-wall-04.png",
      "/assets/rhythm-wall.png"
    ],
    title: "最终效果参考",
    caption: "适合展示音乐节奏、声音互动、灯光变化和速度挑战"
  },

  "pet-house": {
    images: [
      "/assets/reference/pet-house-01.png",
      "/assets/reference/pet-house-02.png",
      "/assets/reference/pet-house-03.png",
      "/assets/pet-house.png"
    ],
    title: "最终效果参考",
    caption: "适合展示宠物照护、环境监测、温湿度反馈和生活场景"
  },

  "pet-feeder": {
    images: [
      "/assets/reference/pet-feeder-01.png",
      "/assets/reference/pet-feeder-02.png",
      "/assets/reference/pet-feeder-03.png",
      "/assets/pet-feeder.png"
    ],
    title: "最终效果参考",
    caption: "适合展示自动投喂、定时控制、余量检测和小管家系统"
  },

  "basketball-scoreboard": {
    images: [
      "/assets/reference/basketball-scoreboard-01.png",
      "/assets/reference/basketball-scoreboard-02.png",
      "/assets/reference/basketball-scoreboard-03.png",
      "/assets/basketball-scoreboard.png"
    ],
    title: "最终效果参考",
    caption: "适合展示运动计分、比赛规则、倒计时和数据统计"
  },

  "livestream-dashboard": {
    images: [
      "/assets/reference/livestream-dashboard-01.png",
      "/assets/reference/livestream-dashboard-02.png",
      "/assets/reference/livestream-dashboard-03.png",
      "/assets/livestream-dashboard.png"
    ],
    title: "最终效果参考",
    caption: "适合展示直播热度、实时数据、趋势变化和可视化看板"
  },

  "milk-tea-console": {
    images: [
      "/assets/reference/milk-tea-console-01.png",
      "/assets/reference/milk-tea-console-02.png",
      "/assets/reference/milk-tea-console-03.png",
      "/assets/milk-tea-console.png"
    ],
    title: "最终效果参考",
    caption: "适合展示配方比例、参数调节、旋钮输入和比例变化"
  },

  "character-energy-core": {
    images: [
      "/assets/reference/character-energy-core-01.png",
      "/assets/reference/character-energy-core-02.png",
      "/assets/reference/character-energy-core-03.png",
      "/assets/character-energy-core.png"
    ],
    title: "最终效果参考",
    caption: "适合展示角色成长、能量数值、等级变化和灯光反馈"
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

const levelInfo = {
  top: {
    difficulty: "挑战"
  },
  normal: {
    difficulty: "中等"
  },
  weak: {
    difficulty: "简单"
  },
  lowInterest: {
    difficulty: "简单"
  }
};

function safeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSelectedText(selectElement) {
  if (!selectElement) {
    return "";
  }

  return selectElement.options[selectElement.selectedIndex]?.text || selectElement.value || "";
}

function getCurrentConcept() {
  return conceptInput?.value.trim() || "当前知识点";
}

function getCurrentSubject() {
  return subjectSelect?.value || "数学";
}

function getCurrentLevelValue() {
  return levelSelect?.value || "normal";
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
  if (!resultTitle || !matchTag) {
    return;
  }

  const concept = getCurrentConcept();
  resultTitle.textContent = `${activeInterest}主题：${concept}硬件项目`;
  matchTag.textContent = "等待点击生成";
}

function renderWaitingState() {
  if (!projectCards) {
    return;
  }

  projectCards.innerHTML = `
    <article class="project-card empty-card">
      <div class="project-card-header">
        <h4>等待生成项目</h4>
        <span class="badge">未调用 AI</span>
      </div>
      <p>
        现在切换兴趣、课堂时长、硬件套件都不会消耗 token。
        只有点击“生成硬件项目”按钮，才会调用 AI。
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
  if (!projectCards || !resultTitle || !matchTag) {
    return;
  }

  const concept = getCurrentConcept();

  resultTitle.textContent = `${activeInterest}主题：${concept}硬件项目`;
  matchTag.textContent = "AI 生成中";

  projectCards.innerHTML = `
    <article class="project-card loading-card">
      <div class="project-card-header">
        <h4>正在生成硬件项目...</h4>
        <span class="badge">AI 思考中</span>
      </div>
      <p>正在根据知识点、兴趣和可用套件生成 3 个课堂硬件项目。</p>
      <div class="project-meta">
        <div><span>知识点</span><strong>${safeText(concept)}</strong></div>
        <div><span>兴趣</span><strong>${safeText(activeInterest)}</strong></div>
        <div><span>套件</span><strong>${safeText(getCurrentKitLabel())}</strong></div>
        <div><span>时长</span><strong>${safeText(getCurrentDuration())}</strong></div>
      </div>
    </article>
  `;
}

function renderErrorState(message) {
  if (!projectCards || !matchTag) {
    return;
  }

  matchTag.textContent = "生成失败";

  projectCards.innerHTML = `
    <article class="project-card error-card">
      <div class="project-card-header">
        <h4>AI 生成暂时失败</h4>
        <span class="badge">失败</span>
      </div>
      <p><strong>错误信息：</strong>${safeText(message)}</p>
      <p>可以检查 AI_MODEL、AI_API_KEY、AI_BASE_URL 是否正确，或者稍后重新点击生成。</p>
    </article>
  `;
}

function normalizeList(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|；|;|。|、|,|，/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return fallback;
}

function normalizeProject(project, index) {
  const concept = getCurrentConcept();
  const level = levelInfo[getCurrentLevelValue()] || levelInfo.normal;

  const imageKeys = [
    "reaction-trainer",
    "distance-radar",
    "rhythm-wall",
    "pet-house",
    "pet-feeder",
    "basketball-scoreboard",
    "livestream-dashboard",
    "milk-tea-console",
    "character-energy-core"
  ];

  const imageKey = imageLibrary[project?.imageKey]
    ? project.imageKey
    : imageKeys[index % imageKeys.length];

  return {
    title: project?.title || `硬件项目 ${index + 1}`,
    hook:
      project?.hook ||
      `把「${concept}」变成一个可以亲手挑战的${activeInterest}主题任务。`,
    summary:
      project?.summary ||
      `围绕「${concept}」制作一个可互动的硬件项目，让学生通过操作理解知识点。`,
    interactionFlow:
      project?.interactionFlow ||
      `学生动作或传感器输入 → 根据「${concept}」进行计算或判断 → 屏幕、灯光或声音反馈结果`,
    materials: normalizeList(project?.materials, [
      getCurrentKitLabel(),
      ...getCurrentMaterials()
        .split(/[、,，]/)
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, 5)
    ]),
    steps: normalizeList(project?.steps, [
      "准备器材并搭建基本结构",
      "设置传感器或按钮输入",
      "建立知识点和输入数据的对应关系",
      "设置屏幕、灯光或声音反馈",
      "测试并完成一次挑战"
    ]),
    knowledgePoint:
      project?.knowledgePoint ||
      `这个项目把真实输入转化为「${concept}」中的变量或规则，让学生通过硬件反馈观察知识点变化。`,
    masteryTraining:
      project?.masteryTraining ||
      "改变一个参数或目标条件，观察结果如何变化，并尝试从目标结果反推输入条件。",
    challenge:
      project?.challenge ||
      "可以增加计分、等级、速度变化或数据记录功能。",
    difficulty: project?.difficulty || level.difficulty,
    imageKey
  };
}

function getStableImageIndex(project, imageCount) {
  const source = `${project.imageKey}-${project.title}-${project.summary}`;
  let hash = 0;

  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }

  return imageCount > 0 ? hash % imageCount : 0;
}

function getImageInfo(project) {
  const libraryItem = imageLibrary[project.imageKey] || imageLibrary["reaction-trainer"];
  const images = Array.isArray(libraryItem.images) ? libraryItem.images : [];
  const imageIndex = getStableImageIndex(project, images.length);
  const selectedImage = images[imageIndex] || "/assets/reaction-trainer.png";

  return {
    image: selectedImage,
    title: libraryItem.title,
    caption: libraryItem.caption
  };
}

function renderProjects(projects) {
  if (!projectCards || !resultTitle || !matchTag) {
    return;
  }

  const concept = getCurrentConcept();
  const subject = getCurrentSubject();
  const duration = getCurrentDuration();
  const kit = getCurrentKitLabel();

  resultTitle.textContent = `${activeInterest}主题：${concept}硬件项目`;
  matchTag.textContent = `${projects.length} 个项目`;

  projectCards.innerHTML = "";

  projects.forEach((rawProject, index) => {
    const project = normalizeProject(rawProject, index);
    const imageInfo = getImageInfo(project);

    const card = document.createElement("article");
    card.className = "project-card";
    card.style.animationDelay = `${index * 90}ms`;

    const materialItems = project.materials
      .slice(0, 8)
      .map(item => `<li>${safeText(item)}</li>`)
      .join("");

    const stepItems = project.steps
      .slice(0, 6)
      .map(step => `<li>${safeText(step)}</li>`)
      .join("");

    card.innerHTML = `
      <figure class="project-visual">
        <img
          src="${safeText(imageInfo.image)}"
          alt="${safeText(project.title)}"
          loading="lazy"
        />
        <figcaption>
          <strong>${safeText(imageInfo.title)}</strong>
          <span>${safeText(imageInfo.caption)}</span>
        </figcaption>
      </figure>

      <div class="project-card-header">
        <h4>${safeText(project.title)}</h4>
        <span class="badge">${safeText(project.difficulty)}</span>
      </div>

      <p class="project-hook">
        <strong>项目钩子：</strong>
        ${safeText(project.hook)}
      </p>

      <p>
        <strong>项目核心：</strong>
        ${safeText(project.summary)}
      </p>

      <div class="project-meta">
        <div><span>学科</span><strong>${safeText(subject)}</strong></div>
        <div><span>套件</span><strong>${safeText(kit)}</strong></div>
        <div><span>兴趣</span><strong>${safeText(activeInterest)}</strong></div>
        <div><span>时长</span><strong>${safeText(duration)}</strong></div>
      </div>

      <div class="project-section">
        <h5>交互链路：</h5>
        <p>${safeText(project.interactionFlow)}</p>
      </div>

      <div class="project-section">
        <h5>知识点怎么活起来：</h5>
        <p>${safeText(project.knowledgePoint)}</p>
      </div>

      <div class="project-section">
        <h5>材料清单：</h5>
        <ul class="material-list">
          ${materialItems}
        </ul>
      </div>

      <div class="project-section">
        <h5>制作步骤：</h5>
        <ol>
          ${stepItems}
        </ol>
      </div>

      <div class="project-section">
        <h5>融会贯通训练：</h5>
        <p>${safeText(project.masteryTraining)}</p>
      </div>

      <p>
        <strong>进阶挑战：</strong>
        ${safeText(project.challenge)}
      </p>
    `;

    projectCards.appendChild(card);
  });
}

async function requestProjects(payload) {
  const response = await fetch("/api/generate-projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`项目接口返回的不是 JSON：${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(data.detail || data.error || "项目生成失败");
  }

  if (!Array.isArray(data.projects)) {
    throw new Error("AI 没有返回 projects 数组");
  }

  return data.projects;
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
    submitButton.textContent = "正在生成...";
  }

  try {
    renderLoadingState();

    const payload = {
      concept: getCurrentConcept(),
      subject: getCurrentSubject(),
      level: getSelectedText(levelSelect),
      interest: activeInterest,
      kit: getCurrentKitLabel(),
      duration: getCurrentDuration(),
      materials: getCurrentMaterials()
    };

    const projects = await requestProjects(payload);
    renderProjects(projects);
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
  if (!control) {
    return;
  }

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

updateResultHeaderOnly();
renderWaitingState();