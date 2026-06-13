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

      return generateProjects(request, env);
    }

    return serveStatic(request, env);
  }
};

async function generateProjects(request, env) {
  try {
    if (!env.AI_API_KEY || !env.AI_BASE_URL || !env.AI_MODEL) {
      return json({
        error: "AI environment variables are missing",
        need: ["AI_API_KEY", "AI_BASE_URL", "AI_MODEL"]
      }, 500);
    }

    const body = await request.json();

    const {
      concept = "一次函数",
      subject = "数学",
      level = "需要项目带着学",
      interest = "游戏",
      kit = "Arduino / ESP32",
      duration = "60 分钟完成版",
      materials = "ESP32、Arduino、LED灯带、按钮、蜂鸣器、舵机、超声波传感器、OLED屏、纸板、杜邦线、面包板"
    } = body;

    const prompt = `
你是一个硬件创客教育项目生成器。

请根据下面信息，为老师生成 3 个一小时内可以完成的硬件项目。

知识点：${concept}
学科方向：${subject}
学生状态：${level}
学生兴趣：${interest}
可用套件：${kit}
课堂时长：${duration}
现场可用材料：${materials}

要求：
1. 项目必须是硬件项目
2. 项目不能只是简单点亮 LED，要有互动效果
3. 基础版必须能在 1 小时内完成
4. 优先使用现场已有材料
5. 避免高压电、明火、高功率激光、复杂机械加工
6. 每个项目必须返回 imageKey，只能从下面选择：
reaction-trainer,
character-energy-core,
distance-radar,
rhythm-wall,
pet-house,
pet-feeder,
basketball-scoreboard,
livestream-dashboard,
milk-tea-console

只返回严格 JSON，不要 Markdown，不要解释。

返回格式：
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
`;

    const base = env.AI_BASE_URL.replace(/\/$/, "");
    const endpoint = base.endsWith("/chat/completions")
      ? base
      : `${base}/chat/completions`;

    const aiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.AI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        messages: [
          {
            role: "system",
            content: "你是一个擅长创客教育、硬件项目设计和课堂教学设计的 AI 助手。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8
      })
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      return json({
        error: "AI API request failed",
        detail: data
      }, 500);
    }

    const rawText =
      data.choices?.[0]?.message?.content ||
      data.output_text ||
      "";

    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return json(parsed);
    } catch (error) {
      return json({
        error: "AI returned non-JSON content",
        raw: rawText
      }, 502);
    }
  } catch (error) {
    return json({
      error: "AI project generation failed",
      detail: error.message
    }, 500);
  }
}
