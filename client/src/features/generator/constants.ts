export const kitMaterials: Record<string, string> = {
  arduino: "ESP32、Arduino、LED灯带、按钮、蜂鸣器、舵机、超声波传感器、OLED屏、纸板、杜邦线、面包板",
  microbit: "micro:bit 主板、LED灯、按钮、蜂鸣器、舵机、纸板、鳄鱼夹、扩展板、传感器模块",
  paper: "铜箔胶带、纽扣电池、LED灯、纸板、彩纸、导电胶带、开关贴片、马克笔",
  mixed: "纸板、亚克力片、LED灯带、按钮、蜂鸣器、舵机、传感器模块、杜邦线、热熔胶",
  k10: "UNIHIKER K10，内置屏幕、按键、温湿度传感器、光敏传感器、加速度传感器、麦克风、扬声器、RGB LED；优先生成免接线、快速完成、适合课堂展示的硬件项目"
};

export const kitLabels: Record<string, string> = {
  arduino: "Arduino / ESP32 套件",
  microbit: "micro:bit 套件",
  paper: "纸电路 / 无需编程",
  mixed: "纸板 + 电子模块",
  k10: "UNIHIKER K10"
};

export const imageLibrary: Record<string, { images: string[]; title: string; caption: string }> = {
  "reaction-trainer": { images: ["/assets/reaction-trainer.jpg"], title: "项目效果参考", caption: "互动反应、计时挑战" },
  "distance-radar": { images: ["/assets/distance-radar.jpg"], title: "项目效果参考", caption: "距离测量、数据映射" },
  "rhythm-wall": { images: ["/assets/rhythm-wall.jpg"], title: "项目效果参考", caption: "音乐节奏、声音互动" },
  "pet-house": { images: ["/assets/pet-house.jpg"], title: "项目效果参考", caption: "宠物照护、环境监测" },
  "pet-feeder": { images: ["/assets/pet-feeder.jpg"], title: "项目效果参考", caption: "自动投喂、定时控制" },
  "basketball-scoreboard": { images: ["/assets/basketball-scoreboard.jpg"], title: "项目效果参考", caption: "运动计分、比赛规则" },
  "livestream-dashboard": { images: ["/assets/livestream-dashboard.jpg"], title: "项目效果参考", caption: "直播热度、实时数据" },
  "milk-tea-console": { images: ["/assets/milk-tea-console.jpg"], title: "项目效果参考", caption: "配方比例、参数调节" },
  "character-energy-core": { images: ["/assets/character-energy-core.jpg"], title: "项目效果参考", caption: "角色成长、能量数值" }
};

export const conceptSuggestions = [
  "一次函数", "分数与比例", "面积与周长", "角度与几何", "数据统计",
  "声音与振动", "光照与条件判断", "勾股定理", "二元一次方程",
  "电路串联与并联", "概率与随机", "速度与路程", "温度与热传递", "力的合成与分解"
];

export const interestChips = [
  "球星点球大战", "篮球投篮挑战", "音乐节奏灯", "宠物自动喂食器",
  "赛车计时挑战", "科学实验装置", "校园生活助手", "环保监测项目"
];

export const quickReplies = [
  { emoji: "⚽", label: "数学 × 点球大战", text: "我们班学生喜欢足球点球，我想用 K10，让他们学一次函数。" },
  { emoji: "🎵", label: "科学 × 音乐节奏灯", text: "学生喜欢音乐和灯光效果，想用 K10 学习声音与振动。" },
  { emoji: "🌿", label: "科学 × 环保监测", text: "学生对环保有兴趣，想用纸板和电子模块做一个环保监测项目。" },
  { emoji: "🏀", label: "数学 × 投篮计分", text: "学生喜欢篮球，想做一个投篮计分器，学习数据统计。" }
];

export const presetChips = [
  { emoji: "⚽", label: "数学 × 点球大战", concept: "一次函数", interest: "球星点球大战", kit: "k10", duration: "60 分钟项目课" },
  { emoji: "🎵", label: "科学 × 音乐灯", concept: "声音与振动", interest: "音乐节奏灯", kit: "k10", duration: "45 分钟课堂活动" },
  { emoji: "🏀", label: "数学 × 投篮", concept: "数据统计", interest: "篮球投篮挑战", kit: "paper", duration: "30 分钟小任务" },
  { emoji: "🌿", label: "科学 × 环保监测", concept: "光照与条件判断", interest: "环保监测项目", kit: "mixed", duration: "60 分钟项目课" }
];

export const PART_LABELS: Record<string, string> = {
  overview: "项目概述",
  build: "制作步骤",
  practice: "融会训练"
};

export const GENERATION_STEPS = [
  { part: "overview" as const, step: 1, title: "项目概述与交互设计", desc: "正在生成项目标题、学习目标、交互流程和材料清单。" },
  { part: "build" as const, step: 2, title: "制作步骤与知识讲解", desc: "正在生成详细制作步骤、知识点讲解和代码思路。" },
  { part: "practice" as const, step: 3, title: "融会贯通训练与 FAQ", desc: "正在生成基础练习、变化挑战、逆向思维、进阶方向和常见问题。" }
];
