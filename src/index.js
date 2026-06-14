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

    if (url.pathname === "/api/generate-projects" || url.pathname === "/api/generate-instruction") {
      if (request.method !== "POST") {
        return json({ error: "Please use POST" }, 405);
      }

      return handleGenerateInstruction(request, env);
    }

    return serveStatic(request, env);
  }
};

async function handleGenerateInstruction(request, env) {
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

    const prompt = buildInstructionPrompt(input);
    const rawText = await callTextModel(env, prompt);
    const parsed = parseAIJson(rawText);

    if (!parsed || !parsed.instruction) {
      return json(
        {
          error: "AI did not return a valid instruction object",
          elapsedMs: Date.now() - startedAt,
          raw: String(rawText || "").slice(0, 2500)
        },
        502
      );
    }

    const instruction = normalizeInstruction(parsed.instruction, input);

    return json({
      instruction,
      elapsedMs: Date.now() - startedAt
    });
  } catch (error) {
    return json(
      {
        error: "AI instruction generation failed",
        detail: error.message,
        elapsedMs: Date.now() - startedAt
      },
      500
    );
  }
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

function buildInstructionPrompt(input) {
  return `
你是 MakerMind AI 的 STEAM 项目 instruction 生成器。

当前任务：
根据老师输入的知识点、学生兴趣、学习状态、硬件条件，生成 1 份完整的“学习型项目 instruction”。

重要定位：
最终目的不是“做一个项目”，而是“通过项目真正学会一个知识点”。
项目只是学习载体，知识理解、迁移练习、举一反三才是核心。

输出要求：
- 只返回严格 JSON。
- 不要 Markdown。
- 不要 HTML。
- 不要代码块。
- 不要在 JSON 外写任何文字。
- JSON 最外层必须是 { "instruction": { ... } }。
- 不要返回 projects 数组。
- 只生成 1 个完整 instruction。

==============================
一、设计理念
==============================

核心理念：
让知识“活”起来，而不是“展示”知识。

错误做法：
1. 屏幕显示公式。
2. 按钮输入答案。
3. 传感器只显示数字。
4. OLED 显示计算结果。
5. 项目本质像电子试卷。

正确做法：
1. 学生通过身体动作、声音、距离、光照、温湿度、倾斜、按钮等输入参与项目。
2. 传感器不只是“读数据”，而是“感知世界”。
3. 执行器不只是“输出结果”，而是“改变世界”。
4. 知识点不是被展示，而是被学生“摸到、听到、看到、玩到”。
5. 项目必须有任务感、游戏感、生活场景或真实工程意义。

硬件交互等级：
Level 1：被动展示，只显示数据。不要生成。
Level 2：按钮切换，屏幕反馈。除非非常简单，否则不要生成。
Level 3：感知驱动，传感器触发行动，有即时反馈。最低要求。
Level 4：生态闭环，多传感器协同，形成系统。推荐。
Level 5：物理实体，控制舵机、电机、水泵、灯带等真实物体。最佳。

每个项目必须满足：
触发条件（传感器或学生动作）
→ 计算逻辑（知识点中的变量、公式、规则、判断）
→ 行动反馈（屏幕、RGB、扬声器、灯带、舵机、电机、水泵、实体装置）

==============================
二、当前输入
==============================

知识点：${input.concept}
学科方向：${input.subject}
学生状态：${input.level}
学生兴趣：${input.interest}
可用套件：${input.kit}
课堂时长：${input.duration}
可用材料：${input.materials}

如果可用套件是 UNIHIKER K10，要优先使用：
- 2.8寸屏幕：显示角色状态、数据条、仪表盘、动画、曲线、任务进度
- 麦克风：声音大小、拍手、节奏、口令、噪音检测
- 扬声器：提示音、警报、语音反馈、成功/失败音效
- A/B 按钮：开始、确认、切换挑战、抢答、游戏输入
- 温湿度传感器：舒适度、环境变化、生态系统
- 光敏传感器：光照变化、追光、护眼、昼夜变化
- 加速度传感器：倾斜、摇晃、姿态控制、平衡、身体参与
- RGB LED：状态提示、成功失败、等级变化、警戒强度、情绪反馈

==============================
三、instruction 内容要求
==============================

必须包含这些学习模块：

1. 项目头部
- 项目名
- 副标题
- 适合学生状态
- 知识点
- 预计时长
- 硬件
- 项目类型

2. 项目概述
- 核心目标
- 项目简介
- 为什么这个项目能帮助学习该知识点
- 学生为什么会想玩

3. 交互流程预览
必须写清楚：
触发：学生动作或传感器输入
计算：知识点如何参与计算/判断
反馈：灯光、声音、屏幕或实体动作如何反馈
等级：Level 3 / Level 4 / Level 5

4. 材料清单
每个材料要包含：
名称、数量、用途、备注

5. 制作步骤
4 到 6 个步骤。
每一步包含：
标题、预计时间、详细内容、提示、注意事项。
步骤必须具体，不能空泛。
步骤顺序要体现：
理解知识点 → 搭建原型 → 编写/设置交互逻辑 → 测试项目 → 完成挑战

6. 知识点讲解
必须包含：
核心概念
关键公式或核心规则
项目中如何体现知识点
深入理解
常见误区

7. 融会贯通训练
必须包含：
基础练习
变化挑战
逆向思维
综合应用
举一反三
参考答案或提示

8. 代码思路
如果是 K10 / Arduino / ESP32 项目，给一个简化版 starterCode。
代码不必非常长，但要体现核心逻辑。
如果不适合写完整代码，就写伪代码。
starterCode 必须是字符串。

9. 进阶方向
给 4 到 6 个进阶方向。

10. 常见问题 FAQ
给 3 到 5 个常见问题和解决方法。

==============================
四、项目风格要求
==============================

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

==============================
五、固定参考图 imageKey
==============================

imageKey 只能从下面选择一个：
reaction-trainer,
character-energy-core,
distance-radar,
rhythm-wall,
pet-house,
pet-feeder,
basketball-scoreboard,
livestream-dashboard,
milk-tea-console

==============================
六、必须返回的 JSON 格式
==============================

{
  "instruction": {
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
    ],
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
    "starterCode": "",
    "extensions": [],
    "faq": [
      {
        "question": "",
        "answer": ""
      }
    ]
  }
}
`;
}

async function callTextModel(env, prompt) {
  const base = env.AI_BASE_URL.replace(/\/$/, "");
  const endpoint = base.endsWith("/chat/completions")
    ? base
    : `${base}/chat/completions`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

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
              "你是一个擅长中小学 STEAM 教育、项目式学习、硬件创客课程和知识点讲解的 AI 助手。你必须只输出严格 JSON。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.68,
        max_tokens: 8000
      })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error(`Text AI returned non-JSON HTTP response: ${text.slice(0, 800)}`);
    }

    if (!response.ok) {
      throw new Error(`Text AI request failed: ${JSON.stringify(data).slice(0, 1200)}`);
    }

    return data.choices?.[0]?.message?.content || data.output_text || "";
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Text AI request timed out after 60 seconds");
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

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      const maybeJson = cleaned.slice(start, end + 1);
      return JSON.parse(maybeJson);
    }

    throw new Error(`AI returned non-JSON content: ${cleaned.slice(0, 1200)}`);
  }
}

function normalizeInstruction(instruction, input) {
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

  const imageKey = allowedImageKeys.includes(cleanString(instruction.imageKey, ""))
    ? cleanString(instruction.imageKey, "")
    : "reaction-trainer";

  return {
    projectName: cleanString(instruction.projectName, `${input.concept}互动学习项目`),
    subtitle: cleanString(instruction.subtitle, `通过${input.interest}主题硬件项目理解${input.concept}`),
    imageKey,
    meta: {
      studentLevel: cleanString(instruction.meta?.studentLevel, input.level),
      knowledgePoint: cleanString(instruction.meta?.knowledgePoint, input.concept),
      subject: cleanString(instruction.meta?.subject, input.subject),
      interest: cleanString(instruction.meta?.interest, input.interest),
      hardware: cleanString(instruction.meta?.hardware, input.kit),
      timeRequired: cleanString(instruction.meta?.timeRequired, input.duration),
      projectType: cleanString(instruction.meta?.projectType, "STEAM 硬件学习项目")
    },
    overview: {
      coreGoal: cleanString(
        instruction.overview?.coreGoal,
        `通过真实互动理解${input.concept}，而不是只在纸上记公式。`
      ),
      projectIntro: cleanString(
        instruction.overview?.projectIntro,
        `学生将制作一个结合${input.interest}主题的硬件项目，通过传感器输入和即时反馈学习${input.concept}。`
      ),
      whyFun: cleanString(
        instruction.overview?.whyFun,
        "它像一个任务挑战，学生可以通过操作硬件马上看到结果。"
      ),
      learningReasons: normalizeStringArray(instruction.overview?.learningReasons, [
        "把抽象知识点变成可操作的硬件反馈。",
        "通过传感器输入观察变量变化。",
        "通过挑战任务进行举一反三。"
      ])
    },
    interactionFlow: {
      trigger: cleanString(instruction.interactionFlow?.trigger, "学生动作或传感器输入"),
      calculation: cleanString(instruction.interactionFlow?.calculation, `根据${input.concept}进行计算或判断`),
      feedback: normalizeStringArray(instruction.interactionFlow?.feedback, [
        "屏幕显示结果",
        "RGB LED 显示状态",
        "扬声器给出提示音"
      ]),
      level: cleanString(instruction.interactionFlow?.level, "Level 3 感知驱动"),
      levelReason: cleanString(
        instruction.interactionFlow?.levelReason,
        "项目通过传感器触发反馈，学生能即时看到知识点变化。"
      )
    },
    materials: normalizeMaterials(instruction.materials, input),
    steps: normalizeSteps(instruction.steps, input),
    knowledgeExplanation: {
      coreConcept: cleanString(
        instruction.knowledgeExplanation?.coreConcept,
        `${input.concept}的核心是理解变量、关系和变化规则。`
      ),
      keyFormula: cleanString(instruction.knowledgeExplanation?.keyFormula, "根据课程知识点填写公式或规则。"),
      inProject: cleanString(
        instruction.knowledgeExplanation?.inProject,
        "项目把真实输入变成变量，再用硬件反馈显示计算结果。"
      ),
      deepUnderstanding: cleanString(
        instruction.knowledgeExplanation?.deepUnderstanding,
        "学生不仅看到结果，还能通过改变参数理解知识点在不同场景中的变化。"
      ),
      commonMisunderstanding: cleanString(
        instruction.knowledgeExplanation?.commonMisunderstanding,
        "不要只记公式，要理解输入、规则和输出之间的关系。"
      )
    },
    masteryTraining: normalizeMasteryTraining(instruction.masteryTraining, input),
    starterCode: cleanString(
      instruction.starterCode,
      "# starter code\n# 根据项目需要读取传感器输入，计算知识点规则，并输出屏幕/灯光/声音反馈。"
    ),
    extensions: normalizeStringArray(instruction.extensions, [
      "增加计时挑战模式。",
      "加入更多参数变化。",
      "记录数据并绘制曲线。",
      "让学生设计自己的应用场景。"
    ]),
    faq: normalizeFaq(instruction.faq)
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
      warning: ""
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
      warning: ""
    },
    {
      title: "设置硬件反馈",
      duration: "15分钟",
      content: "用屏幕、灯光或声音展示计算结果，让学生立即看到反馈。",
      tips: "反馈越清楚，学习效果越好。",
      warning: ""
    },
    {
      title: "完成挑战任务",
      duration: "10分钟",
      content: "改变参数或场景，让学生用项目结果解释知识点变化。",
      tips: "加入计时、得分或目标挑战会更有吸引力。",
      warning: ""
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
  const text = String(value ?? "").trim();
  return text || fallback;
}
