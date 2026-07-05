// AI 生成模块：三段式 instruction 生成（从原 index.js 迁移）
// 依赖 env.AI_API_KEY / env.AI_BASE_URL / env.AI_MODEL

import { json } from "./utils.js";
import { requireUser, requireRole, assertStudentAccess } from "./rbac.js";

export async function handleDialogueTaskBrief(request, env) {
  const startedAt = Date.now();

  try {
    const body = await request.json();
    const mockMode = env.AI_MOCK === "1";
    const profileResult = await loadAuthorizedStudentProfile(request, env, body.studentId || body.student_id || "");
    if (profileResult.response) return profileResult.response;
    if (mockMode) {
      return json({ reply: "我已结合学生画像整理好需求，可以继续生成个性化方案。", brief: normalizeDialogueBrief(body.brief || {}, {}), elapsedMs: Date.now() - startedAt });
    }

    checkEnv(env);
    const messages = normalizeDialogueMessages(body.messages);
    const previousBrief = normalizeDialogueBrief(body.brief || {}, {});
    const prompt = buildDialogueBriefPrompt(messages, previousBrief, profileResult.profile);
    const parsed = await generateParsedPartWithRetry(env, prompt, "dialogue");
    const normalizedBrief = normalizeDialogueBrief(parsed.brief || parsed.taskBrief || parsed, previousBrief);
    const reply = cleanString(
      parsed.reply || parsed.assistantReply || "我已经更新了课堂需求信息。你可以继续补充，或在信息完整后点击生成。",
      "我已经更新了课堂需求信息。你可以继续补充，或在信息完整后点击生成。"
    );

    return json({
      reply,
      brief: normalizedBrief,
      elapsedMs: Date.now() - startedAt
    });
  } catch (error) {
    return json(
      {
        error: "AI dialogue brief extraction failed",
        detail: error.message,
        elapsedMs: Date.now() - startedAt
      },
      500
    );
  }
}

export async function handleStructureSession(request, env) {
  const startedAt = Date.now();

  try {
    const auth = await requireUser(request, env);
    if (auth.response) return auth.response;
    const roleError = requireRole(auth.user, ["teacher"]);
    if (roleError) return roleError;

    const body = await request.json();
    const transcript = cleanString(body.rawTranscript || body.raw_transcript || "", "").slice(0, 6000);
    if (!transcript) return json({ error: "缺少课堂转写文本" }, 400);

    const mockMode = env.AI_MOCK === "1";
    if (!mockMode) checkEnv(env);
    const profile = await loadStudentProfile(env, body.studentId || body.student_id || "");
    const prompt = buildStructureSessionPrompt(transcript, profile);
    const parsed = mockMode ? mockStructuredSession(transcript) : await generateParsedPartWithRetry(env, prompt, "session");
    const structured = normalizeStructuredSession(parsed);

    return json({ structured, elapsedMs: Date.now() - startedAt });
  } catch (error) {
    return json({ error: "AI session structuring failed", detail: error.message, elapsedMs: Date.now() - startedAt }, 500);
  }
}

export async function handleGenerateInstructionPart(request, env) {
  const startedAt = Date.now();

  try {
    const body = await request.json();
    const mockMode = env.AI_MOCK === "1";
    const profileResult = await loadAuthorizedStudentProfile(request, env, body.studentId || body.student_id || "");
    if (!mockMode) checkEnv(env);
    if (profileResult.response) return profileResult.response;

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
    const prompt = buildPartPrompt(input, part, profileResult.profile);
    let parsed;
    let degraded = false;
    let source = mockMode ? "mock" : "ai";
    let warning = "";

    if (mockMode) {
      parsed = mockInstructionPart(part, input, profileResult.profile);
    } else {
      try {
        parsed = await generateParsedPartWithRetry(env, prompt, part);
      } catch (error) {
        degraded = true;
        source = "fallback";
        warning = "AI 服务暂时不稳定，本段已使用基础模板生成，可稍后重新生成优化。";
        console.warn(`[${part}] AI 多次失败，启用基础模板兜底：`, error?.message || error);
        parsed = fallbackInstructionPart(part, input, profileResult.profile, error);
      }
    }

    const partData = parsed[part] || parsed.data || parsed;

    if (!partData || typeof partData !== "object") {
      return json(
        {
          error: `AI did not return a valid ${part} object`,
          elapsedMs: Date.now() - startedAt
        },
        502
      );
    }

    const normalized = normalizePartData(part, partData, input);

    return json({
      part,
      data: normalized,
      degraded,
      source,
      warning,
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

async function generateParsedPartWithRetry(env, prompt, part) {
  const maxAttempts = part === "dialogue" ? 3 : 4;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const rawText = await callTextModel(env, prompt, part);
      return parseAIJson(rawText);
    } catch (error) {
      lastError = error;
      const retryable = isRetryableAIError(error);
      console.warn(
        `[${part}] AI 生成或解析失败，第 ${attempt}/${maxAttempts} 次，retryable=${retryable}：`,
        error?.message || error
      );

      if (!retryable || attempt >= maxAttempts) break;
      await sleep(getRetryDelayMs(error, attempt));
    }
  }

  throw lastError || new Error(`${part} 生成失败，请稍后重试。`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableAIError(error) {
  if (!error) return true;
  if (error.nonRetryable) return false;
  if (error.isParseFailure || error.isTimeout || error.name === "AbortError") return true;
  if (error.status) return [408, 409, 429, 500, 502, 503, 504, 529].includes(Number(error.status));
  const message = String(error.message || error).toLowerCase();
  if (message.includes("missing variables")) return false;
  if (message.includes("401") || message.includes("403") || message.includes("invalid api key")) return false;
  return /fetch|network|timeout|timed out|econn|socket|json|parse|non-json|unexpected/.test(message);
}

function getRetryDelayMs(error, attempt) {
  if (error?.retryAfterMs) return Math.min(error.retryAfterMs, 8000);
  const base = Math.min(700 * (2 ** (attempt - 1)), 5000);
  const jitter = ((attempt * 379) % 900) + 100;
  return base + jitter;
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

function buildPartPrompt(input, part, profile = null) {
  const personalizedInput = { ...input, studentProfileBlock: formatStudentProfileForPrompt(profile) };
  if (part === "overview") {
    return buildOverviewPrompt(personalizedInput);
  }

  if (part === "build") {
    return buildBuildPrompt(personalizedInput);
  }

  return buildPracticePrompt(personalizedInput);
}

function normalizeDialogueMessages(value) {
  const list = Array.isArray(value) ? value : [];

  return list
    .slice(-12)
    .map(item => ({
      role: item?.role === "user" ? "user" : "assistant",
      content: cleanString(item?.content, "").slice(0, 900)
    }))
    .filter(item => item.content);
}

function buildDialogueBriefPrompt(messages, brief, profile = null) {
  const transcript = messages.length
    ? messages.map(item => `${item.role === "user" ? "老师" : "AI"}：${item.content}`).join("\n")
    : "老师还没有输入。";

  return `
你是 MakerMind AI 的课堂项目生成前置对话助手。

你的任务不是生成完整项目方案，而是通过像备课聊天一样的方式，提取并更新一个结构化任务简报。

必须了解的三项核心信息：
1. studentInterest：学生感兴趣的事情、主题、游戏、生活场景或作品方向。
2. hardwareKit：老师希望使用的硬件、材料或套件，例如 UNIHIKER K10、Arduino / ESP32、micro:bit、纸电路、纸板 + 电子模块。
3. knowledgeGoal：老师希望学生学到的具体知识点，例如一次函数、温度变化、条件判断、声音与振动、数据统计。

上一轮任务简报：
${JSON.stringify(brief)}

学生画像（如果有，请用于推断更合适的兴趣场景、难度和追问方式，但不要编造完整项目）：
${formatStudentProfileForPrompt(profile)}

当前对话：
${transcript}

对话策略：
- 以后出现的老师修正优先，例如“改成纸电路”必须覆盖旧硬件。
- 如果三项核心信息都已经明确，reply 要确认将如何生成，并提示可以点击生成或继续补充。
- 如果仍缺信息，reply 最多追问 1-2 个问题，优先问缺失的核心字段。
- 可以根据知识点推断 subject，例如一次函数属于数学，声音与振动属于科学。
- 如果没有学生状态，level 默认“需要项目带着学”。
- 如果没有课堂时长，duration 默认“60 分钟项目课”。
- 不要生成完整项目步骤、代码、材料清单或训练题。

必须只返回严格 JSON，不要 Markdown，不要代码块，不要在 JSON 外写任何文字。
JSON 结构必须是：
{
  "reply": "给老师的下一句回复",
  "brief": {
    "studentInterest": "",
    "hardwareKit": "",
    "knowledgeGoal": "",
    "subject": "",
    "level": "",
    "duration": "",
    "confidence": {
      "studentInterest": 0,
      "hardwareKit": 0,
      "knowledgeGoal": 0
    },
    "missingFields": [],
    "readyToGenerate": false
  }
}`;
}

function baseDesignRules(input) {
  return `
你是 MakerMind AI 的 STEAM 项目 instruction 生成器。

当前目标：
根据老师输入的知识点、学生兴趣、学习状态、硬件条件，生成一份"学习型项目 instruction"的其中一部分。

产品定位：
最终目的不是"做一个项目"，而是"通过项目真正学会一个知识点"。
项目只是学习载体，知识理解、迁移练习、举一反三才是核心。

输入信息：
- 知识点：${input.concept}
- 学科方向：${input.subject}
- 学生状态：${input.level}
- 学生兴趣：${input.interest}
- 可用套件：${input.kit}
- 课堂时长：${input.duration}
- 可用材料：${input.materials}

学生画像（如为空则按普通班级项目生成）：
${input.studentProfileBlock || "无指定学生画像"}

个性化要求：
- 如果画像显示基础弱，要降低代码复杂度，增加图形化、动作化和即时反馈。
- 如果画像显示能力强，要增加变式挑战、参数调优和开放探索。
- 场景选择优先贴合兴趣方向与近期课堂中的投入点。
- 如果性格特点显示耐心不足或容易放弃，步骤要更短，反馈更即时。
- 避免把画像当作永久标签，用“本次更适合”来设计。

核心设计理念：
1. 让知识"活"起来，而不是"展示"知识。
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
- subtitle：一句话说明"通过什么项目理解什么知识点"。
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
5. 两种语言的代码思路：C++ / Arduino 和 MicroPython / K10

内容要求：
- 这部分一定要体现"学习"，不能只是做项目。
- 制作步骤要具体，适合老师照着讲。
- 知识讲解要适合中小学生，不要太学术。
- 代码只需要体现核心逻辑，不要写特别长。
- C++ 版本适合 Arduino / ESP32。
- MicroPython 版本适合 UNIHIKER K10 / micro:bit / Python 风格硬件。
- 两种代码都必须体现：读取传感器输入 → 根据知识点计算或判断 → 输出屏幕、灯光、声音反馈。
- 代码应该尽量像标准代码，而不是全部靠左的说明文字。

非常重要：
为了避免 JSON 出错，不要把代码写成一个大字符串。
starterCodeCppLines 和 starterCodePythonLines 必须都是字符串数组。
每一行代码作为数组中的一个字符串。
可以用两个空格或四个空格表示缩进，形成标准代码结构。
每个字符串必须是一行，不能包含真实换行。
每个字符串内部不要再使用英文双引号 "。
如果需要字符串，请使用中文描述或单引号。
不要返回 starterCode 字符串，只返回 starterCodeCppLines 和 starterCodePythonLines 数组。

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
    "starterCodeCppLines": [
      "#include <Servo.h>",
      "Servo myServo;",
      "const int trigPin = 5;",
      "const int echoPin = 6;",
      "void setup() {",
      "  myServo.attach(9);",
      "}",
      "void loop() {",
      "  float x = readSensor();",
      "  float y = 1.5 * x + 10;",
      "  outputFeedback(y);",
      "}"
    ],
    "starterCodePythonLines": [
      "k = 1.5",
      "b = 10",
      "while True:",
      "  x = read_sensor()",
      "  y = k * x + b",
      "  show_feedback(y)"
    ]
  }
}

字段要求：
- steps：5 到 7 步。
- 步骤顺序必须体现：
  理解知识点 → 搭建原型 → 设置输入 → 建立知识规则 → 设置反馈 → 测试挑战 → 总结知识。
- 每一步 content 要具体，不能只写一句空话。
- tips：给老师或学生的提示。
- warning：如果没有危险，也要写"注意先完成基础版，不要一开始做太复杂"。
- coreConcept：解释 ${input.concept} 的核心概念。
- keyFormula：如果有公式，写公式；如果没有公式，写核心规则。
- inProject：解释项目如何体现知识点。
- deepUnderstanding：帮助学生从现象理解本质。
- commonMisunderstanding：指出学生容易误解的地方。
- starterCodeCppLines：C++ / Arduino 风格，每一项是一行代码。
- starterCodePythonLines：MicroPython / K10 风格，每一项是一行代码。
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

function fallbackInstructionPart(part, input, profile, error) {
  const profileHint = profile?.student?.interest_direction || input.interest;
  const reason = cleanString(error?.message, "上游 AI 暂时不可用").slice(0, 160);
  if (part === "overview") {
    return {
      overview: {
        projectName: `${input.interest}中的${input.concept}挑战`,
        subtitle: `用${input.kit}把${input.concept}变成可观察的互动任务`,
        imageKey: chooseFallbackImageKey(input),
        meta: {
          studentLevel: input.level,
          knowledgePoint: input.concept,
          subject: input.subject,
          interest: input.interest,
          hardware: input.kit,
          timeRequired: input.duration,
          projectType: "STEAM 基础兜底项目"
        },
        overview: {
          coreGoal: `让学生通过${input.interest}场景，观察输入变化如何影响${input.concept}相关结果。`,
          projectIntro: `学生制作一个${input.interest}主题互动装置，用${input.kit}采集一个动作或环境输入，再把${input.concept}转化为屏幕、灯光或声音反馈。`,
          whyFun: "它保留任务挑战、即时反馈和可展示成果，即使 AI 服务波动也能先用于课堂。",
          learningReasons: [
            `把${input.concept}从纸面公式变成可操作变量。`,
            "学生能通过多次尝试观察输入、规则和输出。",
            "硬件反馈能及时暴露理解是否正确。",
            "后续 AI 恢复后还可以重新生成更精细版本。"
          ]
        },
        interactionFlow: {
          trigger: "学生按键、倾斜、拍手或改变环境数据作为输入。",
          calculation: `把输入数值代入${input.concept}的规则，计算等级、得分或状态。`,
          feedback: ["屏幕显示当前数值和任务状态", "RGB LED 用颜色提示成功/失败/等级", "扬声器或提示文字给出下一步建议"],
          level: "Level 3 感知驱动",
          levelReason: "它具备输入感知、知识规则计算和即时行动反馈三段闭环。"
        },
        materials: [
          { name: input.kit, quantity: "1套", usage: "采集输入并输出反馈", note: "按现有课堂材料替换也可以" },
          { name: "USB 数据线", quantity: "1根", usage: "供电和程序上传", note: "保持设备稳定供电" },
          { name: "纸板/卡纸", quantity: "若干", usage: "制作任务场景和展示板", note: "用于增强代入感" },
          { name: "记录表", quantity: "1张/人", usage: "记录输入、计算和输出", note: "帮助学生解释知识点" }
        ]
      }
    };
  }
  if (part === "build") {
    return {
      build: {
        steps: [
          { title: `拆解${input.concept}规则`, duration: "8分钟", content: `老师先和学生一起找出${input.concept}里的输入变量、变化规则和输出结果。`, tips: "让学生先用自己的话解释规则。", warning: "注意先完成基础版，不要一开始做太复杂。" },
          { title: "搭建最小互动原型", duration: "10分钟", content: `用${input.kit}完成一个输入和一个反馈，例如按键/倾斜/声音输入对应屏幕或灯光变化。`, tips: "先确认每个硬件模块能独立工作。", warning: "避免同时接入太多模块。" },
          { title: "写入知识点计算", duration: "15分钟", content: `把输入值作为变量，按照${input.concept}规则计算得分、等级或状态。`, tips: "每改一次参数都让学生预测结果。", warning: "保留一个成功版本，方便回滚。" },
          { title: "设计即时反馈", duration: "10分钟", content: "把计算结果变成屏幕文字、LED 颜色或声音提示，让学生立刻知道操作效果。", tips: "反馈语言要和任务目标对应。", warning: "反馈太多会干扰学生关注知识点。" },
          { title: "挑战与讲解", duration: "12分钟", content: "学生完成三次挑战，记录输入和输出，并向同伴解释为什么结果会变化。", tips: "用展示讲解检验是否真正理解。", warning: "如果时间不足，只保留一次完整挑战。" }
        ],
        knowledgeExplanation: {
          coreConcept: `${input.concept}关注的是变量之间的关系，以及规则变化如何影响结果。`,
          keyFormula: `基础规则：输入 x → 根据${input.concept}处理 → 输出 y 或状态。`,
          inProject: "项目中的传感器读数就是输入变量，程序规则就是知识点，屏幕/灯光/声音就是输出结果。",
          deepUnderstanding: "学生通过改变输入和参数，能看到同一规则在不同情况下的结果变化。",
          commonMisunderstanding: "学生容易只记住项目效果，而没有解释输入、规则、输出之间的因果关系。"
        },
        starterCodeCppLines: ["int inputValue = 0;", "float result = 0;", "void setup() {", "  Serial.begin(115200);", "}", "void loop() {", "  inputValue = readSensor();", "  result = inputValue * 1.0;", "  showFeedback(result);", "  delay(100);", "}"],
        starterCodePythonLines: ["while True:", "  x = read_sensor()", "  y = x", "  show_feedback(y)", "  sleep(0.1)"]
      }
    };
  }
  return {
    practice: {
      masteryTraining: {
        basicPractice: { task: `记录 3 组输入和输出，说明它们如何体现${input.concept}。`, hint: "先找输入变量，再看输出变化。", answer: "能说出输入、规则、输出的对应关系即可。" },
        variationChallenge: { task: "改变一个参数，让结果更容易或更难达到目标。", hint: "一次只改一个参数。", answer: "参数变化会改变输出结果或达标难度。" },
        reverseThinking: { task: "给定一个目标输出，反推输入应该大约是多少。", hint: "从目标结果倒推规则。", answer: "能给出合理输入范围，并用项目验证。" },
        comprehensiveApplication: { task: `把${input.concept}应用到另一个${input.interest}相关场景中。`, hint: "保留规则，替换故事和任务。", answer: "能说明新场景中的输入、规则、输出。" },
        transferQuestion: { task: "设计下一版项目，要求多一个反馈方式。", hint: "可以增加灯光、声音、分数或时间限制。", answer: "提出一个可实现拓展，并说明它如何帮助理解知识点。" }
      },
      extensions: ["加入计时挑战，比较不同策略的结果", "增加数据记录表，画出输入和输出关系", "让学生自己设计关卡参数", "AI 服务恢复后重新生成精细版并对比差异"],
      faq: [
        { question: "为什么这部分看起来像基础模板？", answer: `因为 AI 服务暂时不稳定，系统先用可上课的兜底方案保证不中断。原因：${reason}` },
        { question: "后续还能优化吗？", answer: "可以。AI 恢复后重新生成同一知识点和兴趣场景，就能得到更个性化版本。" },
        { question: "课堂时间不够怎么办？", answer: "先完成一个输入、一个规则、一个反馈，再做拓展。" }
      ]
    }
  };
}

function chooseFallbackImageKey(input) {
  const text = `${input.interest} ${input.concept}`;
  if (/篮球|投篮/.test(text)) return "basketball-scoreboard";
  if (/音乐|节奏|声音/.test(text)) return "rhythm-wall";
  if (/宠物|喂食/.test(text)) return "pet-feeder";
  if (/距离|雷达/.test(text)) return "distance-radar";
  if (/直播|数据/.test(text)) return "livestream-dashboard";
  return "reaction-trainer";
}

function mockInstructionPart(part, input, profile) {
  const profileHint = profile?.student?.interest_direction || input.interest;
  if (part === "overview") {
    return { overview: { projectName: `${input.concept}个性化挑战`, subtitle: `结合${profileHint || input.interest}理解${input.concept}`, imageKey: "reaction-trainer", meta: { studentLevel: input.level, knowledgePoint: input.concept, subject: input.subject, interest: input.interest, hardware: input.kit, timeRequired: input.duration, projectType: "STEAM 个性化项目" }, overview: { coreGoal: `让学生通过${input.interest}场景理解${input.concept}`, projectIntro: "根据学生画像调整任务难度和反馈节奏。", whyFun: "贴合学生兴趣，有即时反馈。", learningReasons: ["结合学生兴趣", "根据近期表现调整难度", "用动手任务理解知识", "通过反馈保持投入"] }, interactionFlow: { trigger: "学生动作或传感器输入", calculation: `围绕${input.concept}进行判断`, feedback: ["屏幕反馈", "灯光提示", "声音鼓励"], level: "Level 3 感知驱动", levelReason: "输入、计算、反馈形成闭环" }, materials: [{ name: input.kit, quantity: "1 套", usage: "完成互动项目", note: "按学生能力降低或提高复杂度" }] } };
  }
  if (part === "build") {
    return { build: { steps: [{ title: "理解任务", duration: "8 分钟", content: "先用学生熟悉的场景解释知识点。", tips: "多提问", warning: "先做基础版" }, { title: "搭建原型", duration: "12 分钟", content: "完成一个输入和一个反馈。", tips: "及时鼓励", warning: "避免功能过多" }, { title: "测试优化", duration: "15 分钟", content: "让学生根据反馈调整参数。", tips: "记录变化", warning: "保留成功版本" }], knowledgeExplanation: { coreConcept: input.concept, keyFormula: "根据知识点选择公式或规则", inProject: "项目反馈体现知识点变化", deepUnderstanding: "让学生解释输入、规则、输出", commonMisunderstanding: "不要只关注效果，忽略规则" }, starterCodeCppLines: ["void setup() {}", "void loop() {", "  // read input and show feedback", "}"], starterCodePythonLines: ["while True:", "  x = read_sensor()", "  show_feedback(x)"] } };
  }
  return { practice: { masteryTraining: { basicPractice: { task: "解释输入和输出的关系", hint: "看反馈变化", answer: "能说出规则即可" }, variationChallenge: { task: "改变一个参数", hint: "观察结果", answer: "结果会随参数变化" }, reverseThinking: { task: "根据目标反推输入", hint: "倒着想", answer: "给出合理输入范围" }, comprehensiveApplication: { task: "迁移到生活场景", hint: "找类似系统", answer: "说明输入、处理、输出" }, transferQuestion: { task: "设计下一版", hint: "结合兴趣", answer: "提出一个可实现拓展" } }, extensions: ["增加关卡", "记录数据", "加入合作任务", "做展示海报"], faq: [{ question: "太难怎么办？", answer: "先保留一个输入和一个反馈。" }, { question: "太简单怎么办？", answer: "增加参数变化挑战。" }] } };
}

async function loadAuthorizedStudentProfile(request, env, studentId) {
  if (!studentId) return { profile: null, response: null };
  const auth = await requireUser(request, env);
  if (auth.response) return { profile: null, response: auth.response };
  if (auth.user.role !== "teacher") return { profile: null, response: json({ error: "只有教师可以基于学生画像生成项目" }, 403) };
  const access = await assertStudentAccess(env, auth.user, studentId);
  if (access.response) return { profile: null, response: access.response };
  return { profile: await loadStudentProfile(env, studentId), response: null };
}

function formatStudentProfileForPrompt(profile) {
  if (!profile?.student) return "无指定学生画像";
  const student = profile.student;
  const recent = (profile.recentSessions || []).map(item => ({
    summary: item.structured_summary,
    skills: item.skills_demonstrated,
    score: item.understanding_score,
    date: item.session_date
  }));
  return JSON.stringify({
    name: student.name,
    skillLevel: student.skill_level,
    interestDirection: student.interest_direction,
    personalityTraits: student.personality_traits,
    learningStyle: student.learning_style,
    learningGoal: student.learning_goal,
    recentSessions: recent
  }, null, 2);
}

async function loadStudentProfile(env, studentId) {
  if (!studentId) return null;
  const student = await env.DB.prepare(
    `SELECT student_id, name, skill_level, interest_direction, personality_traits, learning_style, learning_goal
     FROM students WHERE student_id = ?`
  )
    .bind(studentId)
    .first();
  if (!student) return null;

  const { results } = await env.DB.prepare(
    `SELECT structured_summary, skills_demonstrated, understanding_score, session_date
     FROM sessions se
     JOIN student_projects sp ON se.student_project_id = sp.id
     WHERE sp.student_id = ?
     ORDER BY se.session_date DESC
     LIMIT 3`
  )
    .bind(studentId)
    .all();

  return { student, recentSessions: results || [] };
}

function buildStructureSessionPrompt(transcript, profile) {
  const student = profile?.student || {};
  const recent = (profile?.recentSessions || []).map(item => ({
    summary: item.structured_summary,
    skills: item.skills_demonstrated,
    score: item.understanding_score,
    date: item.session_date
  }));

  return `
你是 MakerMind AI 的课堂记录结构化助手。

请把老师的课堂语音转写，整理成可保存到 sessions 表的结构化 JSON，并提取可用于更新学生画像的信号。

学生画像：
${JSON.stringify({
  name: student.name || "未指定",
  skillLevel: student.skill_level || "",
  interestDirection: student.interest_direction || "",
  personalityTraits: student.personality_traits || "",
  learningStyle: student.learning_style || "",
  learningGoal: student.learning_goal || "",
  recentSessions: recent
})}

课堂转写：
${transcript}

判断规则：
- progressDelta 是本节课对当前项目进度的增量，范围 0 到 30；没有明显进展时给 0-5。
- understandingScore 是 1 到 5 的整数，5 表示理解很好。
- personalityTraits 和 interestSignals 只提取本节课真实体现出的观察，不要永久贴标签。
- suggestedNextProject 要具体，能作为下一次项目生成的起点。

必须只返回严格 JSON，不要 Markdown，不要代码块：
{
  "structuredSummary": "本节课学了...",
  "topicsCovered": ["主题1"],
  "skillsDemonstrated": ["技能1"],
  "progressDelta": 15,
  "understandingScore": 4,
  "teacherNotes": "建议下节课...",
  "personalityTraits": ["耐心"],
  "interestSignals": ["对游戏化项目特别投入"],
  "learningStyle": "更适合动手试错 + 即时反馈",
  "suggestedNextProject": "建议下次做..."
}`;
}

function mockStructuredSession(transcript) {
  return {
    structuredSummary: `本节课围绕${transcript.slice(0, 40)}进行了学习与实践。`,
    topicsCovered: ["课堂实践", "项目调试"],
    skillsDemonstrated: ["表达能力", "动手实践"],
    progressDelta: 15,
    understandingScore: 4,
    teacherNotes: "下节课可继续强化学生对关键概念的解释。",
    personalityTraits: ["愿意尝试", "主动表达"],
    interestSignals: ["对互动项目投入"],
    learningStyle: "适合动手试错和即时反馈",
    suggestedNextProject: "基于本节课兴趣继续做一个带挑战关卡的互动装置"
  };
}

function normalizeStructuredSession(data) {
  const progressDelta = Math.max(0, Math.min(30, Number.parseInt(data.progressDelta ?? data.progress_delta ?? 0, 10) || 0));
  const understandingScore = Math.max(1, Math.min(5, Number.parseInt(data.understandingScore ?? data.understanding_score ?? 3, 10) || 3));
  return {
    structuredSummary: cleanString(data.structuredSummary || data.structured_summary, "本节课完成了课堂学习记录。"),
    topicsCovered: normalizeSessionArray(data.topicsCovered || data.topics_covered),
    skillsDemonstrated: normalizeSessionArray(data.skillsDemonstrated || data.skills_demonstrated),
    progressDelta,
    understandingScore,
    teacherNotes: cleanString(data.teacherNotes || data.teacher_notes, ""),
    personalityTraits: normalizeSessionArray(data.personalityTraits || data.personality_traits),
    interestSignals: normalizeSessionArray(data.interestSignals || data.interest_signals),
    learningStyle: cleanString(data.learningStyle || data.learning_style, ""),
    suggestedNextProject: cleanString(data.suggestedNextProject || data.suggested_next_project, "")
  };
}

function normalizeSessionArray(value) {
  const arr = Array.isArray(value) ? value : value ? [value] : [];
  return arr.map(item => cleanString(item, "")).filter(Boolean).slice(0, 8);
}

function systemPrompt() {
  return `你是 MakerMind AI 的 STEAM 教育项目设计专家。

你的核心使命：
不是"做一个炫酷的硬件项目"，而是"通过一个项目让学生真正理解一个知识点"。
项目是学习的载体，知识理解、迁移练习、举一反三才是最终目的。

核心设计原则：
1. 知识优先：项目必须围绕知识点展开，硬件是学习工具不是炫技道具。
2. 拒绝电子试卷：不要做"屏幕显示公式、按钮输入答案、传感器显示数字"这类被动展示项目。
3. 身体参与：学生要通过动作、声音、距离、光照、温度、倾斜、按钮等身体方式参与。
4. 感知世界：传感器不只是读数据，而是感知环境变化、人的行为、物理规律。
5. 改变世界：执行器不只是输出结果，而是驱动实体动作、改变环境状态、产生真实反馈。
6. 任务驱动：每个项目要有任务感、游戏感、生活场景或真实工程意义。
7. 即时反馈：输入→计算→输出的链路要清晰可见，学生马上能看到结果。
8. 分层递进：从基础版到进阶版，先理解知识再拓展创意。

硬件交互等级（从低到高）：
- Level 1：被动展示，只显示数据 → 绝对不要生成
- Level 2：按钮切换，屏幕反馈 → 尽量不要生成
- Level 3：感知驱动，传感器触发行动，有即时反馈 → 最低要求
- Level 4：生态闭环，多传感器协同，形成系统 → 推荐
- Level 5：物理实体，控制舵机、电机、水泵、灯带等真实物体 → 最佳

输出纪律：
- 只返回严格 JSON，不返回 Markdown，不返回 HTML，不返回代码块。
- 不在 JSON 外写任何解释文字。
- JSON 字符串内不要出现未转义的英文双引号。
- 所有字符串是单行的，不要真实换行，需要多行请用数组。
- 如果你不确定某个字段怎么写，按照要求合理生成，不要留空。`;
}

async function callTextModel(env, prompt, part) {
  const base = env.AI_BASE_URL.replace(/\/$/, "");
  const endpoint = base.endsWith("/chat/completions")
    ? base
    : `${base}/chat/completions`;

  const timeoutMs = Number.parseInt(env.AI_TIMEOUT_MS || "120000", 10) || 120000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const tokenByPart = {
    dialogue: 1600,
    session: 2200,
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
            content: systemPrompt()
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.58,
        max_tokens: tokenByPart[part] || 4000
      })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      const error = new Error(`Text AI returned non-JSON HTTP response: ${text.slice(0, 900)}`);
      error.status = response.status;
      error.isParseFailure = true;
      throw error;
    }

    if (!response.ok) {
      const error = new Error(`Text AI request failed: ${JSON.stringify(data).slice(0, 1200)}`);
      error.status = response.status;
      error.responseSnippet = JSON.stringify(data).slice(0, 1200);
      const retryAfter = response.headers.get("retry-after");
      if (retryAfter) {
        const seconds = Number.parseFloat(retryAfter);
        error.retryAfterMs = Number.isFinite(seconds) ? seconds * 1000 : 0;
      }
      if ([400, 401, 403, 404].includes(response.status)) error.nonRetryable = true;
      throw error;
    }

    return data.choices?.[0]?.message?.content || data.output_text || "";
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error(`Text AI ${part} request timed out after ${timeoutMs}ms`);
      timeoutError.isTimeout = true;
      throw timeoutError;
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

  const error = new Error(
    `${lastError?.message || "AI returned non-JSON content"}。原始内容片段：${cleaned.slice(0, 1200)}`
  );
  error.isParseFailure = true;
  throw error;
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


function normalizeDialogueBrief(data, previousBrief = {}) {
  const fallback = previousBrief || {};
  const confidenceInput = data?.confidence && typeof data.confidence === "object" ? data.confidence : {};
  const studentInterest = cleanString(data?.studentInterest, fallback.studentInterest || "");
  const hardwareKit = cleanString(data?.hardwareKit, fallback.hardwareKit || "");
  const knowledgeGoal = cleanString(data?.knowledgeGoal, fallback.knowledgeGoal || "");
  const missingFields = [];

  if (!studentInterest) missingFields.push("studentInterest");
  if (!hardwareKit) missingFields.push("hardwareKit");
  if (!knowledgeGoal) missingFields.push("knowledgeGoal");

  return {
    studentInterest,
    hardwareKit,
    knowledgeGoal,
    subject: cleanString(data?.subject, fallback.subject || inferSubjectFromConcept(knowledgeGoal)),
    level: cleanString(data?.level, fallback.level || "需要项目带着学"),
    duration: cleanString(data?.duration, fallback.duration || "60 分钟项目课"),
    confidence: {
      studentInterest: clampConfidence(confidenceInput.studentInterest, studentInterest ? 0.82 : 0),
      hardwareKit: clampConfidence(confidenceInput.hardwareKit, hardwareKit ? 0.82 : 0),
      knowledgeGoal: clampConfidence(confidenceInput.knowledgeGoal, knowledgeGoal ? 0.82 : 0)
    },
    missingFields,
    readyToGenerate: missingFields.length === 0
  };
}

function clampConfidence(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(1, number));
}

function inferSubjectFromConcept(concept) {
  const text = String(concept || "");
  if (/函数|方程|比例|分数|面积|周长|角度|几何|统计|概率|勾股/.test(text)) return "数学";
  if (/电路|力|速度|路程|声|光|温度|热|振动/.test(text)) return "科学";
  if (/编程|算法|数据|条件判断|传感器/.test(text)) return "信息技术";
  return "综合实践";
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
  const starterCodeCpp = Array.isArray(data.starterCodeCppLines)
    ? data.starterCodeCppLines.map(line => String(line).replace(/\s+$/g, "")).filter(line => line.trim()).join("\n")
    : Array.isArray(data.starterCodeLines)
      ? data.starterCodeLines.map(line => String(line).replace(/\s+$/g, "")).filter(line => line.trim()).join("\n")
      : cleanString(
          data.starterCodeCpp || data.starterCode,
          "#include <Servo.h>\n\nServo myServo;\n\nvoid setup() {\n  myServo.attach(9);\n}\n\nvoid loop() {\n  float x = readSensor();\n  float y = 1.5 * x + 10;\n  outputFeedback(y);\n}"
        );

  const starterCodePython = Array.isArray(data.starterCodePythonLines)
    ? data.starterCodePythonLines.map(line => String(line).replace(/\s+$/g, "")).filter(line => line.trim()).join("\n")
    : cleanString(
        data.starterCodePython,
        "k = 1.5\nb = 10\n\nwhile True:\n  x = read_sensor()\n  y = k * x + b\n  show_feedback(y)"
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
    starterCode: starterCodeCpp,
    starterCodeCpp,
    starterCodePython
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
