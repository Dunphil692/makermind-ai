function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

async function serveStatic(request, env) {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    url.pathname = "/index.html";
  } else if (!url.pathname.includes(".") && !url.pathname.startsWith("/api/")) {
    url.pathname = `${url.pathname}.html`;
  }

  return env.ASSETS.fetch(new Request(url.toString(), request));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/generate-instruction-part") {
      if (request.method !== "POST") {
        return json({ error: "Please use POST" }, 405);
      }

      return handleGenerateInstructionPart(request, env);
    }

    if (url.pathname === "/api/generate-projects" || url.pathname === "/api/generate-instruction") {
      if (request.method !== "POST") {
        return json({ error: "Please use POST" }, 405);
      }

      return json(
        {
          error: "This generator now uses segmented instruction generation",
          detail: "Please call /api/generate-instruction-part with part = overview, build, or practice."
        },
        400
      );
    }

    return serveStatic(request, env);
  }
};

async function handleGenerateInstructionPart(request, env) {
  const startedAt = Date.now();

  try {
    checkEnv(env);

    const body = await request.json();

    const input = {
      concept: body.concept || "一次函数",
      subject: body.subject || "数学",
      level: body.level || "需要项目带着学",
      interest: body.interest || "游戏",
      kit: body.kit || "UNIHIKER K10",
      duration: body.duration || "60 分钟完成版",
      materials:
        body.materials ||
        "UNIHIKER K10，内置屏幕、按钮、温湿度传感器、光敏传感器、加速度传感器、麦克风、扬声器、RGB LED"
    };

    const part = normalizePartName(body.part || body.section || "overview");
    const prompt = buildPartPrompt(input, part);
    const rawText = await callTextModel(env, prompt, part);
    const parsed = parseAIJson(rawText);

    const partData = parsed[part] || parsed.data || parsed;

    if (!partData || typeof partData !== "object") {
      return json(
        {
          error: `AI did not return a valid ${part} object`,
          elapsedMs: Date.now() - startedAt,
          raw: String(rawText || "").slice(0, 2500)
        },
        502
      );
    }

    const normalized = normalizePartData(part, partData, input);

    return json({
      part,
      data: normalized,
      elapsedMs: Date.now() - startedAt
    });
  } catch (error) {
    return json(
      {
        error: "AI instruction part generation failed",
        detail: error.message,
        elapsedMs: Date.now() - startedAt
      },
      500
    );
  }
}

function normalizePartName(value) {
  const part = String(value || "").trim();

  if (["overview", "build", "practice"].includes(part)) {
    return part;
  }

  return "overview";
}

function checkEnv(env) {
  const missing = [];

  if (!env.AI_API_KEY) missing.push("AI_API_KEY");
  if (!env.AI_BASE_URL) missing.push("AI_BASE_URL");
  if (!env.AI_MODEL) missing.push("AI_MODEL");

  if (missing.length > 0) {
    throw new Error(`Missing variables: ${missing.join(", ")}`);
  }
}

function buildPartPrompt(input, part) {
  if (part === "overview") {
    return buildOverviewPrompt(input);
  }

  if (part === "build") {
    return buildBuildPrompt(input);
  }

  return buildPracticePrompt(input);
}

function baseDesignRules(input) {
  return `
你是 MakerMind AI 的 STEAM 项目 instruction 生成器。

当前目标：
根据老师输入的知识点、学生兴趣、学习状态、硬件条件，生成一份“学习型项目 instruction”的其中一部分。

产品定位：
最终目的不是“做一个项目”，而是“通过项目真正学会一个知识点”。
项目只是学习载体，知识理解、迁移练习、举一反三才是核心。

输入信息：
- 知识点：${input.concept}
- 学科方向：${input.subject}
- 学生状态：${input.level}
- 学生兴趣：${input.interest}
- 可用套件：${input.kit}
- 课堂时长：${input.duration}
- 可用材料：${input.materials}

核心设计理念：
1. 让知识“活”起来，而不是“展示”知识。
2. 不要生成电子试卷式项目。
3. 不要只是屏幕显示公式、按钮输入答案、传感器显示数字。
4. 学生要通过身体动作、声音、距离、光照、温湿度、倾斜、按钮等输入参与项目。
5. 传感器不只是读数据，而是感知世界。
6. 执行器不只是输出结果，而是改变世界。
7. 每个项目必须有任务感、游戏感、生活场景或真实工程意义。
8. 项目必须围绕知识点：${input.concept}。
9. 项目必须结合学生兴趣：${input.interest}。
10. 项目要能在 ${input.duration} 内完成基础版。

硬件交互等级：
Level 1：被动展示，只显示数据。不要生成。
Level 2：按钮切换，屏幕反馈。尽量不要生成。
Level 3：感知驱动，传感器触发行动，有即时反馈。最低要求。
Level 4：生态闭环，多传感器协同，形成系统。推荐。
Level 5：物理实体，控制舵机、电机、水泵、灯带等真实物体。最佳。

每个项目必须满足：
触发条件（传感器或学生动作）
→ 计算逻辑（知识点中的变量、公式、规则、判断）
→ 行动反馈（屏幕、RGB、扬声器、灯带、舵机、电机、水泵、实体装置）

如果可用套件是 UNIHIKER K10，要优先使用：
- 2.8寸屏幕：显示角色状态、数据条、仪表盘、动画、曲线、任务进度
- 麦克风：声音大小、拍手、节奏、口令、噪音检测
- 扬声器：提示音、警报、语音反馈、成功/失败音效
- A/B 按钮：开始、确认、切换挑战、抢答、游戏输入
- 温湿度传感器：舒适度、环境变化、生态系统
- 光敏传感器：光照变化、追光、护眼、昼夜变化
- 加速度传感器：倾斜、摇晃、姿态控制、平衡、身体参与
- RGB LED：状态提示、成功失败、等级变化、警戒强度、情绪反馈

固定参考图 imageKey 只能从下面选择一个：
reaction-trainer,
character-energy-core,
distance-radar,
rhythm-wall,
pet-house,
pet-feeder,
basketball-scoreboard,
livestream-dashboard,
milk-tea-console

输出要求：
- 只返回严格 JSON。
- 不要 Markdown。
- 不要 HTML。
- 不要代码块。
- 不要在 JSON 外写任何文字。
- JSON 字符串内部不要出现没有转义的英文双引号。
- 所有字符串必须是单行字符串，字符串内部禁止真实换行、Tab 等控制字符。
- 如果需要多行内容，必须使用数组拆成多行，例如 starterCodeLines。
`;
}

function buildOverviewPrompt(input) {
  return `
${baseDesignRules(input)}

现在只生成 instruction 的第 1 部分：项目概述、交互流程、材料清单。

这一部分要完成：
1. 项目名和副标题
2. 项目元信息
3. 项目概述
4. 为什么学生会想玩
5. 为什么它能帮助理解知识点
6. 交互流程预览
7. 材料清单

项目名字不能像教材标题。
不要写：
- 距离测量仪
- 函数计算器
- 温度显示器
- 声音检测器
- 数据记录仪

要写成：
- 停车挑战雷达
- 节奏光墙：速度挑战
- 宠物舒适度小屋
- 自动投喂小管家
- 角色能量核心
- 奶茶配方调参台
- 直播热度看板
- 方程探索器

必须返回这个 JSON 结构：

{
  "overview": {
    "projectName": "",
    "subtitle": "",
    "imageKey": "",
    "meta": {
      "studentLevel": "",
      "knowledgePoint": "",
      "subject": "",
      "interest": "",
      "hardware": "",
      "timeRequired": "",
      "projectType": ""
    },
    "overview": {
      "coreGoal": "",
      "projectIntro": "",
      "whyFun": "",
      "learningReasons": []
    },
    "interactionFlow": {
      "trigger": "",
      "calculation": "",
      "feedback": [],
      "level": "",
      "levelReason": ""
    },
    "materials": [
      {
        "name": "",
        "quantity": "",
        "usage": "",
        "note": ""
      }
    ]
  }
}

字段要求：
- projectName：要有吸引力，像一个任务、游戏或生活装置。
- subtitle：一句话说明“通过什么项目理解什么知识点”。
- coreGoal：必须强调学习目标，不只是项目目标。
- projectIntro：讲清楚学生要做什么，硬件如何互动。
- whyFun：说明学生为什么会想玩。
- learningReasons：至少 4 条，解释项目如何帮助理解 ${input.concept}。
- trigger：学生动作或传感器输入。
- calculation：知识点如何参与计算或判断。
- feedback：至少 3 条，说明屏幕、灯光、声音或实体动作如何反馈。
- level：Level 3 / Level 4 / Level 5。
- levelReason：说明为什么达到这个等级。
- materials：4 到 8 项，优先使用可用材料：${input.materials}
`;
}

function buildBuildPrompt(input) {
  return `
${baseDesignRules(input)}

现在只生成 instruction 的第 2 部分：制作步骤、知识点讲解、代码思路。

这一部分要完成：
1. 详细制作步骤
2. 知识点讲解
3. 项目中如何体现知识点
4. 常见误区
5. starterCodeLines 代码思路

内容要求：
- 这部分一定要体现“学习”，不能只是做项目。
- 制作步骤要具体，适合老师照着讲。
- 知识讲解要适合中小学生，不要太学术。
- 代码只需要体现核心逻辑，不要写特别长。
- 如果是 Arduino / ESP32，可以给 Arduino 风格伪代码或简化代码。
- 如果是 K10，可以给 MicroPython 风格伪代码或简化代码。
- 代码思路必须体现：读取传感器输入 → 根据知识点计算/判断 → 输出屏幕/灯光/声音反馈。
- 代码应该尽量像标准代码，而不是全部靠左的说明文字。

非常重要：
为了避免 JSON 出错，不要把代码写成一个大字符串。
starterCodeLines 必须是字符串数组。
每一行代码作为数组中的一个字符串。
可以用两个空格或四个空格表示缩进，形成标准代码结构。
每个字符串必须是一行，不能包含真实换行。
每个字符串内部不要再使用英文双引号 "。
如果需要字符串，请使用中文描述或单引号。
不要返回 starterCode 字符串，只返回 starterCodeLines 数组。

必须返回这个 JSON 结构：

{
  "build": {
    "steps": [
      {
        "title": "",
        "duration": "",
        "content": "",
        "tips": "",
        "warning": ""
      }
    ],
    "knowledgeExplanation": {
      "coreConcept": "",
      "keyFormula": "",
      "inProject": "",
      "deepUnderstanding": "",
      "commonMisunderstanding": ""
    },
    "starterCodeLines": [
      "初始化传感器和输出设备",
      "读取传感器输入值",
      "把输入值转换成知识点中的变量",
      "根据知识点公式或规则计算结果",
      "用屏幕、灯光或声音反馈结果"
    ]
  }
}

字段要求：
- steps：5 到 7 步。
- 步骤顺序必须体现：
  理解知识点 → 搭建原型 → 设置输入 → 建立知识规则 → 设置反馈 → 测试挑战 → 总结知识。
- 每一步 content 要具体，不能只写一句空话。
- tips：给老师或学生的提示。
- warning：如果没有危险，也要写“注意先完成基础版，不要一开始做太复杂”。
- coreConcept：解释 ${input.concept} 的核心概念。
- keyFormula：如果有公式，写公式；如果没有公式，写核心规则。
- inProject：解释项目如何体现知识点。
- deepUnderstanding：帮助学生从现象理解本质。
- commonMisunderstanding：指出学生容易误解的地方。
- starterCodeLines：必须是数组，每一项是一行代码或伪代码，不要返回 starterCode 字符串。
`;
}

function buildPracticePrompt(input) {
  return `
${baseDesignRules(input)}

现在只生成 instruction 的第 3 部分：融会贯通训练、进阶方向、FAQ。

这一部分是最重要的学习收尾：
它要证明学生不是只做完项目，而是真的理解了知识点。

必须包含：
1. 基础练习
2. 变化挑战
3. 逆向思维
4. 综合应用
5. 举一反三
6. 进阶方向
7. 常见问题 FAQ

训练任务必须围绕知识点：${input.concept}
不能写成普通项目扩展。
每个训练都要有 task、hint、answer。
answer 可以是参考答案、判断标准或示例答案。

必须返回这个 JSON 结构：

{
  "practice": {
    "masteryTraining": {
      "basicPractice": {
        "task": "",
        "hint": "",
        "answer": ""
      },
      "variationChallenge": {
        "task": "",
        "hint": "",
        "answer": ""
      },
      "reverseThinking": {
        "task": "",
        "hint": "",
        "answer": ""
      },
      "comprehensiveApplication": {
        "task": "",
        "hint": "",
        "answer": ""
      },
      "transferQuestion": {
        "task": "",
        "hint": "",
        "answer": ""
      }
    },
    "extensions": [],
    "faq": [
      {
        "question": "",
        "answer": ""
      }
    ]
  }
}

字段要求：
- basicPractice：检验学生是否理解基础知识点。
- variationChallenge：改变参数或条件，让学生观察结果变化。
- reverseThinking：给定目标结果，反推输入或参数。
- comprehensiveApplication：把知识点放进真实应用题或生活情境。
- transferQuestion：举一反三，迁移到新场景。
- extensions：4 到 6 条，必须兼顾项目拓展和知识拓展。
- faq：3 到 5 条，包含硬件问题、学习问题、课堂时间问题。
`;
}

async function callTextModel(env, prompt, part) {
  const base = env.AI_BASE_URL.replace(/\/$/, "");
  const endpoint = base.endsWith("/chat/completions")
    ? base
    : `${base}/chat/completions`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  const tokenByPart = {
    overview: 3600,
    build: 5000,
    practice: 4200
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.AI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "你是一个擅长中小学 STEAM 教育、项目式学习、硬件创客课程和知识点讲解的 AI 助手。你必须只输出严格 JSON，不输出 Markdown，不输出 HTML。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.68,
        max_tokens: tokenByPart[part] || 4000
      })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error(`Text AI returned non-JSON HTTP response: ${text.slice(0, 900)}`);
    }

    if (!response.ok) {
      throw new Error(`Text AI request failed: ${JSON.stringify(data).slice(0, 1200)}`);
    }

    return data.choices?.[0]?.message?.content || data.output_text || "";
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Text AI ${part} request timed out after 120 seconds`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}


function parseAIJson(rawText) {
  const cleaned = String(rawText || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const candidates = [];

  candidates.push(cleaned);

  const extracted = extractJsonObject(cleaned);
  if (extracted && extracted !== cleaned) {
    candidates.push(extracted);
  }

  let lastError = null;

  for (const candidate of candidates) {
    const fixedCandidates = [
      candidate,
      removeTrailingCommas(candidate),
      escapeControlCharactersInJsonStrings(candidate),
      removeTrailingCommas(escapeControlCharactersInJsonStrings(candidate))
    ];

    for (const fixed of fixedCandidates) {
      try {
        return JSON.parse(fixed);
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw new Error(
    `${lastError?.message || "AI returned non-JSON content"}。原始内容片段：${cleaned.slice(0, 1200)}`
  );
}

function extractJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text;
}

function removeTrailingCommas(text) {
  return String(text || "").replace(/,\s*([}\]])/g, "$1");
}

function escapeControlCharactersInJsonStrings(text) {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (!inString) {
      if (ch === '"') {
        inString = true;
      }

      result += ch;
      continue;
    }

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      result += ch;
      inString = false;
      continue;
    }

    if (ch === "\n") {
      result += "\\n";
      continue;
    }

    if (ch === "\r") {
      result += "\\r";
      continue;
    }

    if (ch === "\t") {
      result += "\\t";
      continue;
    }

    const code = ch.charCodeAt(0);
    if (code >= 0 && code < 32) {
      result += "\\u" + code.toString(16).padStart(4, "0");
      continue;
    }

    result += ch;
  }

  return result;
}


function normalizePartData(part, data, input) {
  if (part === "overview") {
    return normalizeOverviewPart(data, input);
  }

  if (part === "build") {
    return normalizeBuildPart(data, input);
  }

  return normalizePracticePart(data, input);
}

function normalizeOverviewPart(data, input) {
  const allowedImageKeys = [
    "reaction-trainer",
    "character-energy-core",
    "distance-radar",
    "rhythm-wall",
    "pet-house",
    "pet-feeder",
    "basketball-scoreboard",
    "livestream-dashboard",
    "milk-tea-console"
  ];

  const imageKeyRaw = cleanString(data.imageKey, "");
  const imageKey = allowedImageKeys.includes(imageKeyRaw) ? imageKeyRaw : "reaction-trainer";

  return {
    projectName: cleanString(data.projectName, `${input.concept}互动学习项目`),
    subtitle: cleanString(data.subtitle, `通过${input.interest}主题硬件项目理解${input.concept}`),
    imageKey,
    meta: {
      studentLevel: cleanString(data.meta?.studentLevel, input.level),
      knowledgePoint: cleanString(data.meta?.knowledgePoint, input.concept),
      subject: cleanString(data.meta?.subject, input.subject),
      interest: cleanString(data.meta?.interest, input.interest),
      hardware: cleanString(data.meta?.hardware, input.kit),
      timeRequired: cleanString(data.meta?.timeRequired, input.duration),
      projectType: cleanString(data.meta?.projectType, "STEAM 硬件学习项目")
    },
    overview: {
      coreGoal: cleanString(
        data.overview?.coreGoal,
        `通过真实互动理解${input.concept}，而不是只在纸上记公式。`
      ),
      projectIntro: cleanString(
        data.overview?.projectIntro,
        `学生将制作一个结合${input.interest}主题的硬件项目，通过传感器输入和即时反馈学习${input.concept}。`
      ),
      whyFun: cleanString(data.overview?.whyFun, "它像一个任务挑战，学生可以通过操作硬件马上看到结果。"),
      learningReasons: normalizeStringArray(data.overview?.learningReasons, [
        "把抽象知识点变成可操作的硬件反馈。",
        "通过传感器输入观察变量变化。",
        "通过挑战任务进行举一反三。",
        "让学生能解释输入、规则和输出之间的关系。"
      ])
    },
    interactionFlow: {
      trigger: cleanString(data.interactionFlow?.trigger, "学生动作或传感器输入"),
      calculation: cleanString(data.interactionFlow?.calculation, `根据${input.concept}进行计算或判断`),
      feedback: normalizeStringArray(data.interactionFlow?.feedback, [
        "屏幕显示结果",
        "RGB LED 显示状态",
        "扬声器给出提示音"
      ]),
      level: cleanString(data.interactionFlow?.level, "Level 3 感知驱动"),
      levelReason: cleanString(
        data.interactionFlow?.levelReason,
        "项目通过传感器触发反馈，学生能即时看到知识点变化。"
      )
    },
    materials: normalizeMaterials(data.materials, input)
  };
}

function normalizeBuildPart(data, input) {
  const starterCode = Array.isArray(data.starterCodeLines)
    ? data.starterCodeLines.map(line => String(line).replace(/\s+$/g, "")).filter(line => line.trim()).join("\n")
    : cleanString(
        data.starterCode,
        "# starter code\n# 读取传感器输入，计算知识点规则，并输出屏幕/灯光/声音反馈。"
      );

  return {
    steps: normalizeSteps(data.steps, input),
    knowledgeExplanation: {
      coreConcept: cleanString(
        data.knowledgeExplanation?.coreConcept,
        `${input.concept}的核心是理解变量、关系和变化规则。`
      ),
      keyFormula: cleanString(data.knowledgeExplanation?.keyFormula, "根据课程知识点填写公式或规则。"),
      inProject: cleanString(
        data.knowledgeExplanation?.inProject,
        "项目把真实输入变成变量，再用硬件反馈显示计算结果。"
      ),
      deepUnderstanding: cleanString(
        data.knowledgeExplanation?.deepUnderstanding,
        "学生不仅看到结果，还能通过改变参数理解知识点在不同场景中的变化。"
      ),
      commonMisunderstanding: cleanString(
        data.knowledgeExplanation?.commonMisunderstanding,
        "不要只记公式，要理解输入、规则和输出之间的关系。"
      )
    },
    starterCode
  };
}

function normalizePracticePart(data, input) {
  return {
    masteryTraining: normalizeMasteryTraining(data.masteryTraining, input),
    extensions: normalizeStringArray(data.extensions, [
      "增加计时挑战模式。",
      "加入更多参数变化。",
      "记录数据并绘制曲线。",
      "让学生设计自己的应用场景。"
    ]),
    faq: normalizeFaq(data.faq)
  };
}

function normalizeMaterials(value, input) {
  if (Array.isArray(value) && value.length > 0) {
    return value.slice(0, 10).map(item => ({
      name: cleanString(item.name, "材料"),
      quantity: cleanString(item.quantity, "1"),
      usage: cleanString(item.usage, "用于项目制作"),
      note: cleanString(item.note, "")
    }));
  }

  return [
    {
      name: input.kit,
      quantity: "1套",
      usage: "主控与交互反馈",
      note: "优先使用已有硬件"
    },
    {
      name: "USB 数据线",
      quantity: "1根",
      usage: "供电和上传程序",
      note: "常规 Type-C 数据线即可"
    },
    {
      name: "纸板或亚克力板",
      quantity: "若干",
      usage: "制作项目外壳或支架",
      note: "可替换为课堂已有材料"
    }
  ];
}

function normalizeSteps(value, input) {
  if (Array.isArray(value) && value.length > 0) {
    return value.slice(0, 8).map(item => ({
      title: cleanString(item.title, "制作步骤"),
      duration: cleanString(item.duration, "10分钟"),
      content: cleanString(item.content, "完成本步骤操作。"),
      tips: cleanString(item.tips, ""),
      warning: cleanString(item.warning, "")
    }));
  }

  return [
    {
      title: `理解${input.concept}的核心问题`,
      duration: "10分钟",
      content: `先用一个生活场景解释${input.concept}，明确输入、规则和输出分别是什么。`,
      tips: "不要急着接线，先让学生说出变量和规则。",
      warning: "注意先完成基础版，不要一开始做太复杂。"
    },
    {
      title: "搭建硬件原型",
      duration: "15分钟",
      content: "准备主控板和基础结构，让学生能看到传感器输入和反馈输出的位置。",
      tips: "先完成最小可运行版本。",
      warning: "避免复杂接线和高风险材料。"
    },
    {
      title: "建立知识点规则",
      duration: "15分钟",
      content: `把传感器输入和${input.concept}中的变量或判断规则对应起来。`,
      tips: "让学生自己解释为什么这样对应。",
      warning: "注意先让规则简单可解释。"
    },
    {
      title: "设置硬件反馈",
      duration: "15分钟",
      content: "用屏幕、灯光或声音展示计算结果，让学生立即看到反馈。",
      tips: "反馈越清楚，学习效果越好。",
      warning: "不要一次加入太多反馈。"
    },
    {
      title: "完成挑战任务",
      duration: "10分钟",
      content: "改变参数或场景，让学生用项目结果解释知识点变化。",
      tips: "加入计时、得分或目标挑战会更有吸引力。",
      warning: "挑战要服务于知识点，不要只追求好玩。"
    }
  ];
}

function normalizeMasteryTraining(value, input) {
  return {
    basicPractice: normalizeTrainingItem(value?.basicPractice, {
      task: `用项目完成一次${input.concept}基础验证，并记录输入和输出。`,
      hint: "先找出输入变量，再观察输出结果。",
      answer: "能说清楚输入、规则和输出之间的关系即可。"
    }),
    variationChallenge: normalizeTrainingItem(value?.variationChallenge, {
      task: "改变一个参数，观察结果如何变化。",
      hint: "只改变一个条件，其他条件保持不变。",
      answer: "结果会随着参数变化而发生规律性变化。"
    }),
    reverseThinking: normalizeTrainingItem(value?.reverseThinking, {
      task: "给定目标结果，反推应该设置什么输入条件。",
      hint: "从输出倒推规则，再找到输入。",
      answer: "能反推合理输入，并用项目验证。"
    }),
    comprehensiveApplication: normalizeTrainingItem(value?.comprehensiveApplication, {
      task: "把项目场景换成另一个生活问题，重新解释知识点。",
      hint: "保留知识规则，替换应用场景。",
      answer: "能说明同一个知识点在不同场景中仍然适用。"
    }),
    transferQuestion: normalizeTrainingItem(value?.transferQuestion, {
      task: "举一个生活中类似的问题，并说明如何用同样方法解决。",
      hint: "从生活里找输入、规则和输出。",
      answer: "能完成举一反三。"
    })
  };
}

function normalizeTrainingItem(value, fallback) {
  return {
    task: cleanString(value?.task, fallback.task),
    hint: cleanString(value?.hint, fallback.hint),
    answer: cleanString(value?.answer, fallback.answer)
  };
}

function normalizeFaq(value) {
  if (Array.isArray(value) && value.length > 0) {
    return value.slice(0, 6).map(item => ({
      question: cleanString(item.question, "常见问题"),
      answer: cleanString(item.answer, "可以先检查材料、步骤和参数设置。")
    }));
  }

  return [
    {
      question: "如果项目运行没有反应怎么办？",
      answer: "先检查供电、程序是否上传成功，再检查传感器输入和反馈输出是否被正确调用。"
    },
    {
      question: "如果学生只关注玩，不关注知识点怎么办？",
      answer: "让学生解释输入、规则和输出之间的关系，并完成融会贯通训练。"
    },
    {
      question: "如果课堂时间不够怎么办？",
      answer: "先完成基础版：一个输入、一个规则、一个反馈。进阶功能留作拓展。"
    }
  ];
}

function normalizeStringArray(value, fallback) {
  if (Array.isArray(value)) {
    const result = value.map(item => String(item).trim()).filter(Boolean);
    return result.length > 0 ? result : fallback;
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|；|;|。/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return fallback;
}

function cleanString(value, fallback) {
  if (Array.isArray(value)) {
    const text = value.map(item => String(item).trim()).filter(Boolean).join("\n");
    return text || fallback;
  }

  if (value && typeof value === "object") {
    try {
      const text = JSON.stringify(value, null, 2);
      return text || fallback;
    } catch {
      return fallback;
    }
  }

  const text = String(value ?? "").trim();
  return text || fallback;
}
