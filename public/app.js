const hardwareProjects = {
  游戏: [
    {
      title: "反应训练舱",
      device: "LED 灯环 + 蜂鸣器 + 按钮 + 计分逻辑",
      angle: "把知识点变成反应时间、等级变化和难度曲线",
      materials: ["Arduino/ESP32", "LED 灯环或 LED x6", "按钮 x2", "蜂鸣器", "电阻", "面包板", "杜邦线", "纸板外壳"],
      steps: ["搭好按钮、蜂鸣器和 LED 输出", "上传能随机亮灯的基础代码", "让按钮记录反应是否成功", "用公式控制等待时间和得分", "展示一次改参数前后的变化"],
      output: "一个可以现场挑战分数的反应训练装置",
      hook: "学生想提高分数时，会自然开始关注参数、函数和判断条件",
      challenge: "加入自动调难度，让连续成功后等待时间变短",
      knowledge: "变量、函数映射、随机、条件判断、数据记录"
    },
    {
      title: "坐标寻宝雷达",
      device: "摇杆或按钮 + LED 点阵 / OLED 显示",
      angle: "把知识点放进坐标移动、路径规划和目标距离提示",
      materials: ["Arduino/ESP32", "摇杆模块或按钮 x4", "OLED 屏或 LED 点阵", "蜂鸣器", "面包板", "杜邦线", "纸质地图"],
      steps: ["设定一个隐藏目标坐标", "用摇杆或按钮控制当前位置", "屏幕显示坐标或距离提示", "用知识点设计得分规则", "让学生解释为什么某条路径更优"],
      output: "一个可以寻找隐藏坐标的实体小游戏",
      hook: "像寻宝游戏一样推进，坐标和函数不再只是纸上的数字",
      challenge: "加入障碍区或最短路径评分",
      knowledge: "平面坐标、距离、一次函数、路径规划"
    },
    {
      title: "Boss 能量控制台",
      device: "旋钮 + LED 灯条 + 舵机指针",
      angle: "用旋钮输入技能强度，LED 和舵机显示 Boss 血量变化",
      materials: ["Arduino/ESP32", "电位器", "LED 灯条", "SG90 舵机", "按钮", "电阻", "面包板", "纸板控制台"],
      steps: ["用旋钮读取技能强度", "LED 表示 Boss 血量", "按钮触发攻击结算", "舵机指针显示危险等级", "解释输入值怎样影响输出效果"],
      output: "一个带输入、计算和反馈的 Boss 战控制台",
      hook: "学生会为了让技能更强而主动研究数值映射",
      challenge: "加入冷却时间或暴击概率",
      knowledge: "比例、线性映射、阈值、概率"
    }
  ],
  宠物: [
    {
      title: "宠物舒适度小屋",
      device: "温湿度传感器 + RGB 灯 + 舵机门",
      angle: "把知识点变成舒适度评分，让环境数据控制宠物屋反馈",
      materials: ["Arduino/ESP32", "温湿度传感器", "RGB LED", "SG90 舵机", "蜂鸣器", "纸板小屋", "杜邦线"],
      steps: ["搭好宠物屋外壳", "读取温湿度或模拟环境数值", "用 RGB 灯显示舒适区间", "舵机门根据评分打开或关闭", "解释评分公式怎样影响反馈"],
      output: "一个会判断环境舒适度的宠物屋模型",
      hook: "照顾宠物的场景很直观，学生会愿意调整规则让小屋更聪明",
      challenge: "加入综合评分，把温度和湿度按不同比例加权",
      knowledge: "数据采集、加权、区间判断、传感器阈值"
    },
    {
      title: "自动投喂决策器",
      device: "按钮 + 舵机 + LED 状态灯",
      angle: "把知识点变成投喂次数、等待时间和状态判断",
      materials: ["Arduino/ESP32", "SG90 舵机", "按钮 x2", "LED x3", "电阻", "纸板粮仓", "杜邦线"],
      steps: ["制作简易粮仓和舵机挡板", "按钮模拟宠物请求", "用 LED 显示能否投喂", "舵机执行一次投喂动作", "说明为什么有时不能继续投喂"],
      output: "一个带规则限制的投喂装置模型",
      hook: "学生会从真实需求出发，理解为什么算法需要限制条件",
      challenge: "加入冷却时间和每日上限",
      knowledge: "条件判断、计数、时间间隔、状态机"
    },
    {
      title: "宠物运动徽章",
      device: "micro:bit 加速度 + LED 图标反馈",
      angle: "把运动次数变成目标进度和奖励反馈",
      materials: ["micro:bit", "电池盒", "纸壳腕带", "贴纸", "可选蜂鸣器"],
      steps: ["读取晃动或加速度变化", "统计有效运动次数", "达到不同目标显示不同图标", "加入鼓励音效或灯效", "解释阈值为什么需要调整"],
      output: "一个可以戴在手上的宠物运动记录徽章",
      hook: "学生可以马上测试动作，反馈速度快",
      challenge: "区分轻微晃动和真实运动",
      knowledge: "阈值、累计、噪声过滤、目标达成"
    }
  ],
  运动: [
    {
      title: "投篮数据训练台",
      device: "按钮 + LED 灯条 + OLED / 数码管",
      angle: "把命中率、连续命中和趋势变化做成可视化反馈",
      materials: ["Arduino/ESP32", "按钮 x2", "OLED 屏或数码管", "LED 灯条", "蜂鸣器", "纸板篮筐", "杜邦线"],
      steps: ["按钮记录命中和未命中", "屏幕显示命中率", "灯条显示当前等级", "连续命中触发音效", "解释每次数据更新怎样改变结果"],
      output: "一个可以记录训练表现的投篮计分台",
      hook: "学生关心表现排名，会愿意理解百分比和趋势",
      challenge: "加入最近 5 次表现的移动平均",
      knowledge: "比例、百分比、平均值、数据更新"
    },
    {
      title: "起跑反应计时器",
      device: "LED + 蜂鸣器 + 按钮 + 计时程序",
      angle: "把随机等待、抢跑判断和反应时间做成训练设备",
      materials: ["Arduino/ESP32", "按钮", "LED x3", "蜂鸣器", "OLED 屏可选", "电阻", "面包板"],
      steps: ["等待随机信号出现", "学生按下按钮完成起跑", "判断是否抢跑", "记录反应时间", "用数据解释快慢差异"],
      output: "一个能测反应速度的起跑训练器",
      hook: "像体育测试一样直接，容易带动现场参与",
      challenge: "记录三次成绩并计算最好成绩和平均成绩",
      knowledge: "随机、时间差、条件判断、平均值"
    },
    {
      title: "挥拍速度徽章",
      device: "加速度传感器 + LED 等级反馈",
      angle: "用运动强度触发等级显示，把数据阈值变成可感知反馈",
      materials: ["micro:bit 或 ESP32 加速度模块", "电池盒", "LED", "纸壳固定带", "贴纸"],
      steps: ["固定徽章到手腕或球拍模型", "读取运动强度", "按阈值显示等级", "测试不同动作", "解释为什么阈值不能设太低"],
      output: "一个能给动作强度分级的小徽章",
      hook: "动起来就有反馈，适合让低兴趣学生进入状态",
      challenge: "加入连续动作计数和休息提醒",
      knowledge: "传感器数据、阈值、分类、噪声"
    }
  ],
  音乐: [
    {
      title: "节奏采样灯墙",
      device: "声音传感器 + LED 灯带 + 按钮",
      angle: "把声音大小和节奏频率转成灯光图案",
      materials: ["Arduino/ESP32", "声音传感器", "LED 灯带", "按钮", "电阻", "纸板灯墙", "杜邦线"],
      steps: ["读取声音传感器数值", "设置低中高三个区间", "让灯带按声音变化", "按钮切换灯效模式", "解释区间和阈值怎样影响效果"],
      output: "一个会跟着声音变化的节奏灯墙",
      hook: "拍手、说话、放音乐都能测试，现场展示感强",
      challenge: "加入峰值保持或节奏加速效果",
      knowledge: "数据范围、阈值、采样、模式切换"
    },
    {
      title: "旋律密码盒",
      device: "按钮 x4 + 蜂鸣器 + LED 解锁反馈",
      angle: "用音符顺序和判断逻辑设计一个声音密码",
      materials: ["Arduino/ESP32", "按钮 x4", "蜂鸣器", "LED x2", "电阻", "纸板盒", "杜邦线"],
      steps: ["四个按钮对应四个音", "设置一组正确旋律", "输入正确后亮灯解锁", "错误时给出提示音", "解释顺序判断和状态变化"],
      output: "一个可以用旋律解锁的密码盒",
      hook: "学生会为了设计自己的密码，主动理解条件判断和顺序",
      challenge: "加入错误次数限制和重置按钮",
      knowledge: "序列、条件判断、状态机、声音频率"
    },
    {
      title: "声音控制小舞台",
      device: "声音传感器 + 舵机 + RGB 灯",
      angle: "用音量控制舞台动作和灯光层级",
      materials: ["Arduino/ESP32", "声音传感器", "SG90 舵机", "RGB LED", "纸板舞台", "杜邦线"],
      steps: ["搭建纸板小舞台", "读取音量数据", "音量高时舵机摆动", "RGB 灯显示强度", "解释数据映射到动作的过程"],
      output: "一个会听声音反应的小舞台",
      hook: "作品有动作也有灯光，比单纯 LED 更有表现力",
      challenge: "加入安静、普通、高潮三个舞台模式",
      knowledge: "输入输出映射、阈值、PWM、状态切换"
    }
  ],
  动漫: [
    {
      title: "角色能量核心",
      device: "LED 灯环 + 按钮 + 舵机机关",
      angle: "把角色能量、技能冷却和升级规则做成实体徽章",
      materials: ["Arduino/ESP32", "LED 灯环", "按钮", "SG90 舵机", "纸板徽章", "电阻", "杜邦线"],
      steps: ["制作角色能量徽章", "按钮增加能量", "能量满格触发灯效", "舵机打开技能机关", "解释能量增长和冷却规则"],
      output: "一个会蓄能和释放技能的角色徽章",
      hook: "角色设定会把抽象公式变成可见状态",
      challenge: "加入不同角色的技能曲线",
      knowledge: "函数增长、阈值、状态机、反馈控制"
    },
    {
      title: "魔法阵路径解锁盘",
      device: "铜箔触点 + LED + 蜂鸣器",
      angle: "把路径顺序、逻辑判断和电路通断做成魔法阵机关",
      materials: ["卡纸", "铜箔胶带", "LED", "蜂鸣器", "纽扣电池或 micro:bit", "回形针", "贴纸"],
      steps: ["画出魔法阵路线", "贴出触点和导电路径", "按正确顺序触发亮灯", "错误路径触发提示", "解释电路通断和顺序判断"],
      output: "一个需要按路线解锁的发光魔法阵",
      hook: "不需要大量代码，也能做出有剧情感的交互作品",
      challenge: "加入两条路线，对应不同结局",
      knowledge: "电路通断、顺序、条件、图结构雏形"
    },
    {
      title: "角色表情状态机",
      device: "舵机翻牌 + RGB 灯 + 按钮",
      angle: "用按钮事件改变角色状态，把状态机做成可见表情",
      materials: ["Arduino/ESP32", "SG90 舵机", "按钮 x2", "RGB LED", "纸板表情牌", "电阻", "杜邦线"],
      steps: ["制作三张角色表情牌", "舵机控制表情切换", "按钮触发开心或生气", "灯光显示状态强度", "解释状态转移规则"],
      output: "一个能根据事件切换表情的角色机关",
      hook: "角色反馈可爱，学生会愿意继续设计更多状态",
      challenge: "加入隐藏状态或连续触发效果",
      knowledge: "状态机、角度、事件触发、条件判断"
    }
  ],
  美食: [
    {
      title: "奶茶配方调参台",
      device: "双旋钮 + LED 等级 + OLED 显示",
      angle: "把甜度、冰量和价格规则做成可调参数系统",
      materials: ["Arduino/ESP32", "电位器 x2", "OLED 屏或 LED x6", "按钮", "电阻", "纸板菜单", "杜邦线"],
      steps: ["两个旋钮控制甜度和冰量", "屏幕或 LED 显示等级", "按钮确认配方", "计算推荐口味或价格", "解释数值映射和权重"],
      output: "一个可以调配口味的奶茶控制台",
      hook: "生活化场景能让比例和函数变得容易讨论",
      challenge: "加入顾客偏好评分和推荐算法",
      knowledge: "比例、线性映射、权重、条件判断"
    },
    {
      title: "厨房热度分级塔",
      device: "温度传感器 + LED 灯塔 + 蜂鸣器",
      angle: "把温度范围、预警等级和安全反馈做成可视化装置",
      materials: ["Arduino/ESP32", "温度传感器", "LED x5 或灯条", "蜂鸣器", "纸板灯塔", "电阻", "杜邦线"],
      steps: ["读取温度数据", "设置安全、偏热、过热等级", "LED 灯塔显示等级", "过热时蜂鸣器提醒", "解释为什么阈值要分段"],
      output: "一个能显示温度等级的厨房提醒塔",
      hook: "作品有实际用途，学生更容易理解数据判断的意义",
      challenge: "加入温度变化趋势提醒",
      knowledge: "区间、阈值、传感器、趋势判断"
    },
    {
      title: "披萨公平分配轮盘",
      device: "舵机指针 + 按钮 + LED 提示",
      angle: "用人数和份数模拟分配，展示平均、余数和公平规则",
      materials: ["Arduino/ESP32", "SG90 舵机", "按钮 x2", "LED x4", "纸板披萨轮盘", "电阻", "杜邦线"],
      steps: ["按钮调整人数和披萨块数", "舵机指针指向每人份数", "LED 提示是否有剩余", "设计公平补偿规则", "解释平均分和余数"],
      output: "一个能演示公平分配的披萨轮盘",
      hook: "用吃的讲数学，学生更容易进入情境",
      challenge: "加入多人优先级或随机抽签规则",
      knowledge: "除法、余数、平均分配、规则设计"
    }
  ],
  短视频: [
    {
      title: "直播热度仪表盘",
      device: "按钮 + LED 灯环 + OLED 热度显示",
      angle: "把点赞、评论和热度等级做成可实时变化的仪表盘",
      materials: ["Arduino/ESP32", "按钮 x2", "LED 灯环", "OLED 屏", "蜂鸣器", "纸板灯牌", "杜邦线"],
      steps: ["按钮模拟点赞和评论", "OLED 显示热度值", "LED 灯环显示等级", "热度超过阈值触发音效", "解释增长规则和等级边界"],
      output: "一个会随互动变化的直播热度仪表盘",
      hook: "短视频语境贴近学生，现场参与感强",
      challenge: "加入热度衰减，让长时间不互动时热度下降",
      knowledge: "累计、增长、衰减、阈值"
    },
    {
      title: "弹幕频率报警器",
      device: "按钮连击 + LED + 蜂鸣器 + 计时",
      angle: "用单位时间内的点击次数模拟弹幕密度",
      materials: ["Arduino/ESP32", "按钮", "LED x3", "蜂鸣器", "OLED 屏可选", "电阻", "面包板"],
      steps: ["连续点击模拟弹幕", "统计 5 秒内次数", "超过阈值时报警", "显示热度等级", "解释频率和时间窗口"],
      output: "一个可以制造爆屏效果的弹幕报警器",
      hook: "学生会为了让报警器触发，不断测试频率规则",
      challenge: "加入滑动窗口，让报警更接近真实热度判断",
      knowledge: "频率、时间窗口、阈值、数据统计"
    },
    {
      title: "自动补光导演灯",
      device: "光敏传感器 + PWM LED + 舵机角度",
      angle: "把环境光数据转成补光亮度和角度建议",
      materials: ["Arduino/ESP32", "光敏传感器", "高亮 LED 或 LED 灯条", "SG90 舵机", "电阻", "纸板支架", "杜邦线"],
      steps: ["读取环境光数值", "判断画面是否太暗", "用 PWM 调整补光亮度", "舵机指示推荐角度", "解释光照数值怎样影响输出"],
      output: "一个会根据环境调整的拍摄补光装置",
      hook: "直接服务拍摄场景，学生会觉得作品有用",
      challenge: "加入自动模式和手动模式切换",
      knowledge: "传感器、PWM、映射、模式切换"
    }
  ]
};

const levelStrategies = {
  top: {
    name: "挑战优化型",
    difficulty: "中高",
    guidance: "基础版压缩到前半节完成，后半节让学生增加优化目标，比如记录数据、改评分规则或设计自动调难度",
    evidence: ["提出一个改进功能", "解释核心变量", "比较改进前后效果"]
  },
  normal: {
    name: "项目带学型",
    difficulty: "中",
    guidance: "先给学生一个能跑起来的最小版本，再通过调参、测试和解释把知识点带出来",
    evidence: ["完成核心接线", "记录一次参数修改", "用自己的话解释原理"]
  },
  weak: {
    name: "分层成功型",
    difficulty: "低到中",
    guidance: "减少未知接线和代码量，保留一个关键变量，让学生先成功再挑战",
    evidence: ["指出输入和输出", "完成一个基础版本", "解释一个参数的作用"]
  },
  lowInterest: {
    name: "强反馈入口型",
    difficulty: "中低",
    guidance: "先展示能亮、能响、能动的效果，再把作品规则翻译成知识点",
    evidence: ["让装置产生效果", "向 AI 问两个为什么", "完成一次个人化改造"]
  }
};

const kitAdjustments = {
  arduino: {
    label: "Arduino / ESP32",
    tip: "适合传感器、LED 灯带、舵机、按钮和显示屏组合",
    code: "Arduino 代码骨架"
  },
  k10: {
    label: "UNIHIKER K10",
    code: "屏幕 UI + 内置传感器 + Python / MicroPython",
    tip: "K10 自带屏幕、按键、温湿度传感器、陀螺仪、麦克风和扬声器，优先生成免接线、快速完成的互动项目"
  },
  microbit: {
    label: "micro:bit",
    tip: "适合加速度、按钮、LED 点阵和快速入门编程",
    code: "MakeCode 或 Python 代码骨架"
  },
  paper: {
    label: "纸电路",
    tip: "适合弱化代码，把重点放在电路通断、结构设计和规则表达",
    code: "电路图和测试记录"
  },
  mixed: {
    label: "纸板 + 电子模块",
    tip: "适合做外观、机关和交互装置，展示感更强",
    code: "模块化代码和结构草图"
  }
};


const mediaLibrary = {
  reaction: {
    image: "assets/reaction-trainer.png",
    anchor: "reaction-trainer",
    caption: "真实场景风格的完成效果参考图，适合展示互动感和游戏感"
  },
  boss: {
    image: "assets/character-energy-core.png",
    anchor: "character-energy-core",
    caption: "真实场景风格的完成效果参考图，适合展示角色设定和能量反馈"
  },
  radar: {
    image: "assets/distance-radar.png",
    anchor: "distance-radar",
    caption: "真实场景风格的完成效果参考图，适合展示数据映射和传感器反馈"
  },
  rhythm: {
    image: "assets/rhythm-wall.png",
    anchor: "rhythm-light-wall",
    caption: "真实场景风格的完成效果参考图，适合展示灯效和声音互动"
  },
  petHouse: {
    image: "assets/pet-house.png",
    anchor: "pet-comfort-house",
    caption: "真实场景风格的完成效果参考图，适合展示外观、传感器和故事感"
  },
  feeder: {
    image: "assets/pet-feeder.png",
    anchor: "pet-feeder",
    caption: "真实场景风格的完成效果参考图，适合展示投喂机构和状态判断"
  },
  basketball: {
    image: "assets/basketball-scoreboard.png",
    anchor: "basketball-scoreboard",
    caption: "真实场景风格的完成效果参考图，适合展示计分与运动主题互动"
  },
  live: {
    image: "assets/livestream-dashboard.png",
    anchor: "livestream-dashboard",
    caption: "真实场景风格的完成效果参考图，适合展示社交媒体热度和数据反馈"
  },
  milkTea: {
    image: "assets/milk-tea-console.png",
    anchor: "milk-tea-console",
    caption: "真实场景风格的完成效果参考图，适合展示参数调节和生活化场景"
  }
};

function getProjectMedia(template, interest) {
  const title = template.title;
  if (title.includes("反应")) return mediaLibrary.reaction;
  if (title.includes("Boss") || title.includes("能量控制台") || title.includes("角色能量") || title.includes("魔法阵") || title.includes("表情状态")) return mediaLibrary.boss;
  if (title.includes("雷达") || title.includes("距离")) return mediaLibrary.radar;
  if (title.includes("节奏") || title.includes("声音控制小舞台") || title.includes("旋律")) return mediaLibrary.rhythm;
  if (title.includes("舒适度小屋")) return mediaLibrary.petHouse;
  if (title.includes("投喂") || title.includes("运动徽章")) return mediaLibrary.feeder;
  if (title.includes("投篮") || title.includes("起跑") || title.includes("挥拍")) return mediaLibrary.basketball;
  if (title.includes("直播") || title.includes("弹幕") || title.includes("补光")) return mediaLibrary.live;
  if (title.includes("奶茶") || title.includes("厨房") || title.includes("披萨")) return mediaLibrary.milkTea;
  if (interest === "游戏") return mediaLibrary.reaction;
  if (interest === "宠物") return mediaLibrary.petHouse;
  if (interest === "运动") return mediaLibrary.basketball;
  if (interest === "音乐") return mediaLibrary.rhythm;
  if (interest === "动漫") return mediaLibrary.boss;
  if (interest === "美食") return mediaLibrary.milkTea;
  if (interest === "短视频") return mediaLibrary.live;
  return mediaLibrary.reaction;
}

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

if (chips.length) {
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(item => item.classList.remove("active"));
      chip.classList.add("active");
      activeInterest = chip.dataset.interest;
      generateProjects();
    });
  });
}

if (form) {
  form.addEventListener("submit", event => {
    event.preventDefault();
    generateProjects();
  });

  [levelSelect, kitSelect, durationSelect, subjectSelect].forEach(control => {
    control.addEventListener("change", generateProjects);
  });

  conceptInput.addEventListener("input", () => {
    window.clearTimeout(conceptInput.timer);
    conceptInput.timer = window.setTimeout(generateProjects, 240);
  });

  generateProjects();
}


function generateProjects() {
  if (!projectCards) return;

  const concept = conceptInput.value.trim() || "当前知识点";
  const subject = subjectSelect.value;
  const duration = durationSelect.value;
  const strategy = levelStrategies[levelSelect.value];
  const kit = kitAdjustments[kitSelect.value];
  const templates = hardwareProjects[activeInterest] || hardwareProjects["游戏"];
  const score = Math.floor(90 + Math.random() * 7);

  resultTitle.textContent = `${activeInterest}主题：${concept}硬件项目`;
  matchTag.textContent = `课堂可完成 ${score}%`;
  projectCards.innerHTML = "";

  templates.forEach((template, index) => {
    const adjustedMaterials = normalizeMaterials(template.materials, kitSelect.value);
    const media = getProjectMedia(template, activeInterest);
    const card = document.createElement("article");
    card.className = "project-card";
    card.style.animationDelay = `${index * 70}ms`;
    card.innerHTML = `
      <div class="project-media">
        <img src="${media.image}" alt="${template.title} 最终效果参考图" />
        <div class="project-media-note">
          <strong>最终效果参考</strong>
          <span>${media.caption}</span>
        </div>
      </div>
      <div class="project-card-header">
        <h3>${template.title}</h3>
        <span class="badge">${strategy.name}</span>
      </div>
      <p><strong>项目核心：</strong>${template.angle}，学生需要用「${concept}」解释作品为什么会这样反馈</p>
      <div class="project-mini-meta">
        <div><span>学科</span><strong>${subject}</strong></div>
        <div><span>套件</span><strong>${kit.label}</strong></div>
        <div><span>难度</span><strong>${strategy.difficulty}</strong></div>
        <div><span>时长</span><strong>${duration}</strong></div>
      </div>
      <p><strong>硬件形态：</strong>${template.device}</p>
      <p><strong>材料清单：</strong></p>
      <div class="mini-list">${adjustedMaterials.map(item => `<span>${item}</span>`).join("")}</div>
      <div class="challenge-row">
        <div><span>知识点落点</span><strong>${template.knowledge}</strong></div>
        <div><span>进阶挑战</span><strong>${template.challenge}</strong></div>
        <div><span>学生产出</span><strong>${template.output}</strong></div>
        <div><span>老师观察点</span><strong>${strategy.evidence.join(" / ")}</strong></div>
      </div>
      <p><strong>建议流程：</strong></p>
      <ol>${template.steps.map(step => `<li>${step}</li>`).join("")}</ol>
      <p><strong>兴趣钩子：</strong>${template.hook}</p>
      <p><strong>老师策略：</strong>${strategy.guidance}</p>
      <p><strong>AI 辅导提示：</strong>我正在做「${template.title}」，请用这个作品解释「${concept}」怎样影响输入、计算和输出，再给我一个能马上测试的改法</p>
      <p><strong>套件建议：</strong>${kit.tip}，输出形式建议为 ${kit.code}</p>
      <div class="project-actions">
        <a class="btn small primary" href="gallery.html#${media.anchor}">查看真实效果</a>
        <a class="btn small ghost" href="students.html">匹配学生画像</a>
        <a class="btn small ghost" href="rules.html">查看项目门槛</a>
      </div>
    `;
    projectCards.appendChild(card);
  });
}

function normalizeMaterials(materials, kitType) {
  if (kitType === "microbit") {
    return materials
      .map(item => item.includes("Arduino") || item.includes("ESP32") ? "micro:bit" : item)
      .filter((item, index, arr) => arr.indexOf(item) === index)
      .slice(0, 8);
  }
  if (kitType === "paper") {
    return ["卡纸", "铜箔胶带", "LED", "纽扣电池", "回形针或纸夹", "彩笔", "双面胶", "任务卡"].slice(0, 8);
  }
  if (kitType === "mixed") {
    const base = materials.map(item => item.includes("Arduino") || item.includes("ESP32") ? "Arduino/ESP32 或 micro:bit" : item);
    return [...base, "纸板外壳", "热熔胶或双面胶"].filter((item, index, arr) => arr.indexOf(item) === index).slice(0, 8);
  }
  return materials.slice(0, 8);
}

const students = document.querySelectorAll(".student");
const studentName = document.getElementById("studentName");
const studentLevel = document.getElementById("studentLevel");
const studentInterests = document.getElementById("studentInterests");
const studentRisk = document.getElementById("studentRisk");
const teacherSuggestion = document.getElementById("teacherSuggestion");

const suggestions = {
  林一鸣: "推荐用反应训练舱或直播热度仪表盘作为入口，先让学生做出可玩的反馈，再要求他解释一次参数修改怎样影响分数、速度或灯效",
  陈小雨: "推荐给她开放挑战，基础版只给 25 分钟，后面增加自动调难度、数据记录或多模式切换，让她把优化思路讲出来",
  周可: "推荐先做节奏采样灯墙或自动补光导演灯，前 10 分钟必须看到灯光或动作反馈，再引导她向 AI 追问阈值为什么这样设"
};

if (students.length) {
  students.forEach(button => {
    button.addEventListener("click", () => {
      students.forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      studentName.textContent = button.dataset.name;
      studentLevel.textContent = button.dataset.level;
      studentInterests.textContent = button.dataset.interests;
      studentRisk.textContent = button.dataset.risk;
      teacherSuggestion.textContent = suggestions[button.dataset.name];
    });
  });
}

// ===== AI backend connection override =====

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

function getAIProjectMedia(imageKey) {
  return aiImageMap[imageKey] || aiImageMap["reaction-trainer"];
}

async function generateProjects() {
  if (!projectCards) return;

  const concept = conceptInput.value.trim() || "当前知识点";
  const subject = subjectSelect.value;
  const level = levelSelect.options[levelSelect.selectedIndex].text;
  const kit = kitSelect.options[kitSelect.selectedIndex].text;
  const duration = durationSelect.value;

  resultTitle.textContent = `${activeInterest}主题：${concept}硬件项目`;
  matchTag.textContent = "AI 生成中";

  projectCards.innerHTML = `
    <article class="project-card">
      <h3>正在生成项目方案</h3>
      <p>AI 正在根据知识点、学生兴趣和硬件材料生成 3 个可完成的硬件项目</p>
    </article>
  `;

  try {
    const response = await fetch("/api/generate-projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        concept,
        subject,
        level,
        interest: activeInterest,
        kit,
        duration,
        materials: kitSelect.value === "k10"
  ? "UNIHIKER K10，内置屏幕、按键、温湿度传感器、陀螺仪、麦克风、扬声器；优先生成免接线、快速完成、能直接用屏幕和传感器展示效果的项目"
  : "ESP32、Arduino、LED灯带、按钮、蜂鸣器、舵机、超声波传感器、OLED屏、纸板、杜邦线、面包板"
      })
    });

    const data = await response.json();

    if (!response.ok || !Array.isArray(data.projects)) {
      throw new Error(data.error || "AI 没有返回可用项目");
    }

    matchTag.textContent = `AI 已生成 ${data.projects.length} 个项目`;
    projectCards.innerHTML = "";

    data.projects.forEach((project, index) => {
      const media = getAIProjectMedia(project.imageKey);
      const card = document.createElement("article");
      card.className = "project-card";
      card.style.animationDelay = `${index * 70}ms`;

      const materials = Array.isArray(project.materials) ? project.materials : [];
      const steps = Array.isArray(project.steps) ? project.steps : [];

      card.innerHTML = `
        <div class="project-media">
          <img src="${media.image}" alt="${safeText(project.title)} 最终效果参考图" />
          <div class="project-media-note">
            <strong>最终效果参考</strong>
            <span>${media.caption}</span>
          </div>
        </div>

        <div class="project-card-header">
          <h3>${safeText(project.title || "未命名硬件项目")}</h3>
          <span class="badge">${safeText(project.difficulty || "中等")}</span>
        </div>

        <p><strong>项目核心：</strong>${safeText(project.summary || "AI 已生成一个与知识点相关的硬件项目")}</p>

        <div class="project-mini-meta">
          <div><span>学科</span><strong>${safeText(subject)}</strong></div>
          <div><span>套件</span><strong>${safeText(kit)}</strong></div>
          <div><span>兴趣</span><strong>${safeText(activeInterest)}</strong></div>
          <div><span>时长</span><strong>${safeText(duration)}</strong></div>
        </div>

        <p><strong>材料清单：</strong></p>
        <div class="mini-list">
          ${materials.map(item => `<span>${safeText(item)}</span>`).join("")}
        </div>

        <div class="challenge-row">
          <div><span>知识点落点</span><strong>${safeText(project.knowledgePoint || concept)}</strong></div>
          <div><span>进阶挑战</span><strong>${safeText(project.challenge || "增加一个可调参数并观察结果变化")}</strong></div>
          <div><span>图片匹配</span><strong>${safeText(project.imageKey || "reaction-trainer")}</strong></div>
          <div><span>老师观察点</span><strong>能否解释输入、规则和输出之间的关系</strong></div>
        </div>

        <p><strong>建议流程：</strong></p>
        <ol>
          ${steps.map(step => `<li>${safeText(step)}</li>`).join("")}
        </ol>

        <div class="project-actions">
          <a class="btn small primary" href="gallery.html#${media.anchor}">查看真实效果</a>
          <a class="btn small ghost" href="students.html">匹配学生画像</a>
          <a class="btn small ghost" href="rules.html">查看项目门槛</a>
        </div>
      `;

      projectCards.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    matchTag.textContent = "生成失败";

    projectCards.innerHTML = `
      <article class="project-card">
        <h3>AI 生成暂时失败</h3>
        <p><strong>错误信息：</strong>${safeText(error.message)}</p>
        <p>可以先检查 AI_MODEL、AI_API_KEY、AI_BASE_URL 是否正确，或者稍后重新点击生成</p>
      </article>
    `;
  }
}
