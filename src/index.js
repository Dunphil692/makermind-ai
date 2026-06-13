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

    if (url.pathname === "/api/generate-projects") {
      if (request.method !== "POST") {
        return json({ error: "Please use POST" }, 405);
      }

      return handleGenerateProjects(request, env);
    }

    return serveStatic(request, env);
  }
};

async function handleGenerateProjects(request, env) {
  try {
    checkEnv(env);

    const body = await request.json();

    const input = {
      concept: body.concept || "一次函数",
      subject: body.subject || "数学",
      level: body.level || "需要项目带着学",
      interest: body.interest || "游戏",
      kit: body.kit || "Arduino / ESP32",
      duration: body.duration || "60 分钟完成版",
      materials:
        body.materials ||
        "ESP32、Arduino、LED灯带、按钮、蜂鸣器、舵机、超声波传感器、OLED屏、纸板、杜邦线、面包板"
    };

    const prompt = buildProjectPrompt(input);
    const rawText = await callTextModel(env, prompt);
    const parsed = parseAIJson(rawText);

    if (!parsed || !Array.isArray(parsed.projects)) {
      return json(
        {
          error: "AI did not return a valid projects array",
          raw: rawText
        },
        502
      );
    }

    const projects = parsed.projects
      .slice(0, 3)
      .map((project, index) => normalizeProject(project, input, index));

    return json({
      projects
    });
  } catch (error) {
    return json(
      {
        error: "AI project generation failed",
        detail: error.message
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

function buildProjectPrompt(input) {
  return `
你是 MakerMind AI 的中小学 STEAM 硬件项目设计助手。

你的任务：
为老师生成 3 个“更吸引学生”的硬件项目方向，让学生通过动手制作理解知识点。

输入信息：
- 知识点：${input.concept}
- 学科方向：${input.subject}
- 学生状态：${input.level}
- 学生兴趣：${input.interest}
- 可用套件：${input.kit}
- 课堂时长：${input.duration}
- 可用材料：${input.materials}

核心原则：
让知识“活”起来，而不是“展示”知识。

不要生成这种无聊项目：
- 屏幕显示公式
- 按钮输入答案
- OLED 显示计算结果
- 做一个检测仪，然后只显示数字

这些项目像“电子试卷”，不够吸引学生。

你要生成这种项目：
- 有游戏感
- 有任务感
- 有生活场景
- 有身体动作或传感器输入
- 有灯光、声音、屏幕动画或实体动作反馈
- 能让学生“感受”知识点的变化

每个项目都必须满足这个交互链路：

学生动作 / 传感器输入
→ 知识点计算或判断
→ 屏幕 / RGB / 扬声器 / 灯带 / 舵机 / 实体装置反馈

例如：
不要写：
“距离测量仪：用超声波传感器测距离，屏幕显示距离。”

要写：
“停车挑战雷达：学生把小车慢慢推向目标区，超声波传感器实时检测距离。距离越近，屏幕上的警戒条越满，RGB 灯从绿变黄再变红，扬声器提示越来越急。系统把距离 x 映射成反馈强度 y，让学生看到一次函数关系。”

项目设计等级要求：
- 至少达到 Level 3：传感器触发行动，有即时反馈
- 更好的项目达到 Level 4：多个输入形成小系统
- 最好的项目达到 Level 5：控制真实物体，如舵机、电机、水泵、灯带

如果可用套件是 UNIHIKER K10，请优先使用它的内置资源：
- 2.8寸屏幕：显示角色状态、数据条、仪表盘、动画或曲线
- 麦克风：声音大小、拍手、节奏、口令
- 扬声器：音效、警报、语音反馈
- A/B按钮：游戏输入、确认、切换挑战
- 温湿度传感器：舒适度、环境变化、生态系统
- 光敏传感器：光照变化、追光、护眼、昼夜变化
- 加速度传感器：倾斜、摇晃、姿态控制、身体参与
- RGB LED：成功失败、等级变化、状态提示

项目内容要求：
1. 必须是硬件项目，不要生成纯软件项目
2. 必须围绕知识点：${input.concept}
3. 必须结合学生兴趣：${input.interest}
4. 必须适合 ${input.duration} 做出基础版
5. 材料要尽量来自：${input.materials}
6. 避免高压电、明火、高功率激光、复杂机械加工
7. 项目名字要有吸引力，像一个游戏、任务、装置或生活小产品
8. 项目要让老师一看就觉得“这个学生可能会想做”

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

请只返回严格 JSON。
不要 Markdown。
不要解释。
不要在 JSON 外面写任何文字。
不要使用代码块。

返回格式必须完全类似下面这样：

{
  "projects": [
    {
      "title": "",
      "summary": "",
      "materials": [],
      "steps": [],
      "knowledgePoint": "",
      "challenge": "",
      "difficulty": "",
      "imageKey": ""
    }
  ]
}

字段要求：

title：
短、有吸引力，像项目名或游戏名。
例如：
“停车挑战雷达”
“节奏光墙：速度挑战”
“宠物舒适度小屋”
“角色能量核心”
“奶茶配方调参台”

summary：
必须写清楚：
学生要做什么；
传感器如何输入；
硬件如何反馈；
知识点如何变成玩法。
不要写教材腔。

materials：
4 到 8 个具体材料。
不要写太泛。

steps：
4 到 6 个具体步骤。
每一步都必须能执行。
步骤要体现：
搭建结构 → 设置输入 → 建立知识点规则 → 输出反馈 → 测试挑战

knowledgePoint：
必须说明这个项目如何帮助理解 ${input.concept}。
不要只写“学习${input.concept}”。

challenge：
写一个进阶挑战。
必须包含下面至少一种：
- 参数变化
- 场景变化
- 逆向思考
- 举一反三

difficulty：
只能写：
简单
中等
挑战

imageKey：
从允许列表中选择最接近项目视觉效果的一个。
`;
}

async function callTextModel(env, prompt) {
  const base = env.AI_BASE_URL.replace(/\/$/, "");
  const endpoint = base.endsWith("/chat/completions")
    ? base
    : `${base}/chat/completions`;

  const response = await fetch(endpoint, {
    method: "POST",
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
            "你是一个擅长中小学 STEAM 教育、硬件项目设计、项目式学习和创客课程设计的 AI 助手。你的输出必须是严格 JSON。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.75
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
    throw new Error(`Text AI request failed: ${JSON.stringify(data)}`);
  }

  return data.choices?.[0]?.message?.content || data.output_text || "";
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

    throw new Error(`AI returned non-JSON content: ${rawText.slice(0, 1000)}`);
  }
}

function normalizeProject(project, input, index) {
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

  const fallbackImageKeys = [
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

  const title = String(project?.title || `创意硬件项目 ${index + 1}`).trim();

  const summary = String(
    project?.summary ||
      `围绕「${input.concept}」制作一个结合${input.interest}主题的互动硬件项目。学生通过传感器输入和即时反馈理解知识点变化。`
  ).trim();

  const materials = normalizeList(project?.materials, [
    input.kit,
    ...String(input.materials || "")
      .split(/[、,，]/)
      .map(item => item.trim())
      .filter(Boolean)
      .slice(0, 6)
  ]);

  const steps = normalizeList(project?.steps, [
    "准备器材并搭建基础结构。",
    "设置传感器或按钮作为输入。",
    `把输入数据和「${input.concept}」建立对应关系。`,
    "用屏幕、灯光或声音做出即时反馈。",
    "调整参数，完成一次挑战测试。"
  ]);

  const knowledgePoint = String(
    project?.knowledgePoint ||
      `这个项目把真实输入数据转化为「${input.concept}」中的变量，让学生通过硬件反馈观察知识点如何变化。`
  ).trim();

  const challenge = String(
    project?.challenge ||
      "尝试改变参数或场景条件，让系统在不同情况下仍然完成任务，并解释背后的知识点变化。"
  ).trim();

  const difficultyRaw = String(project?.difficulty || "中等").trim();
  const difficulty = ["简单", "中等", "挑战"].includes(difficultyRaw)
    ? difficultyRaw
    : "中等";

  const imageKeyRaw = String(project?.imageKey || "").trim();
  const imageKey = allowedImageKeys.includes(imageKeyRaw)
    ? imageKeyRaw
    : fallbackImageKeys[index % fallbackImageKeys.length];

  return {
    title,
    summary,
    materials,
    steps,
    knowledgePoint,
    challenge,
    difficulty,
    imageKey
  };
}

function normalizeList(value, fallback) {
  if (Array.isArray(value)) {
    const result = value
      .map(item => String(item).trim())
      .filter(Boolean);

    return result.length > 0 ? result : fallback;
  }

  if (typeof value === "string" && value.trim()) {
    const result = value
      .split(/\n|；|;|。|、|,|，/)
      .map(item => item.trim())
      .filter(Boolean);

    return result.length > 0 ? result : fallback;
  }

  return fallback;
}
