export const demoInstruction2 = {
      projectName: "音乐节奏灯光台",
      subtitle: "通过声音强弱控制 LED 灯光反馈，理解声音、数据变化和输出关系",
      imageKey: "rhythm-wall",
      meta: {
        studentLevel: "兴趣低，需要强反馈",
        knowledgePoint: "声音与振动",
        subject: "科学",
        interest: "音乐节奏灯",
        hardware: "UNIHIKER K10",
        timeRequired: "45 分钟课堂活动",
        projectType: "STEAM 硬件学习项目"
      },
      overview: {
        coreGoal: "通过声音强度（输入）和 LED 灯光亮度/颜色（输出）的真实互动，让学生理解声音是一种可以被测量和转化的物理量，以及数据输入和输出反馈之间的对应关系。",
        projectIntro: "学生将使用 UNIHIKER K10 制作一个“音乐节奏灯光台”。通过 K10 内置的麦克风读取环境声音强度，将声音数据映射为 LED 灯光的亮度和颜色变化。声音越大，灯光越亮、颜色越热烈；声音越小，灯光越暗、颜色越冷静。学生可以通过拍手、唱歌或播放音乐来控制灯光效果。",
        whyFun: "它像一个随音乐跳舞的灯光秀——学生拍手或唱歌，灯光立刻跟着变化。声音大时灯光热烈闪烁，声音小时灯光柔和呼吸。学生可以举办一场“灯光音乐会”，用身体控制视觉输出。",
        learningReasons: [
          "声音强度可以被量化为数字数据，学生通过灯光变化直观感受“声音有大小”",
          "数据映射关系（声音大→灯亮→颜色热烈）帮助学生理解输入输出的对应规则",
          "通过改变映射参数（灵敏度），学生能理解“同样的输入可以产生不同的输出”",
          "多感官参与（听觉+视觉）让知识记忆更深刻",
          "团队合作的“灯光音乐会”增强课堂趣味性和参与度"
        ]
      },
      interactionFlow: {
        trigger: "学生拍手、唱歌或播放音乐，K10 麦克风读取环境声音强度（分贝值）作为输入",
        calculation: "将声音强度映射为 LED 亮度（0-255）和颜色（冷色到暖色），灵敏度可调",
        feedback: [
          "RGB LED 根据声音强度改变亮度和颜色：小声=暗+冷色，大声=亮+暖色",
          "K10 屏幕实时显示声音强度数值和当前灯光模式",
          "可切换多种灯光模式：呼吸模式、闪烁模式、彩虹模式"
        ],
        level: "Level 3 多模态反馈",
        levelReason: "项目通过麦克风感知声音（听觉输入），经过数据映射计算后，同时驱动 LED 灯光（视觉输出）和屏幕显示（信息输出），形成听觉-计算-视觉的多模态反馈闭环。"
      },
      materials: [
        { name: "UNIHIKER K10", quantity: "1 块", usage: "主控板，提供麦克风输入、RGB LED 输出和屏幕显示", note: "免接线，开箱即用" },
        { name: "USB Type-C 数据线", quantity: "1 根", usage: "供电和程序上传", note: "常规数据线即可" },
        { name: "小型音箱或手机", quantity: "1 个", usage: "播放音乐或节拍，提供稳定的声音输入", note: "可选，学生也可以直接拍手或唱歌" },
        { name: "彩色卡纸", quantity: "若干", usage: "制作灯罩，增强灯光视觉效果", note: "可制作不同形状的灯罩" },
        { name: "双面胶", quantity: "1 卷", usage: "固定灯罩和装饰", note: "常规文具" }
      ],
      steps: [
        {
          title: "探索声音与数据的关系",
          duration: "8 分钟",
          content: "老师先让学生拍手、说话、唱歌，同时观察 K10 屏幕上的声音强度数值变化。引导学生思考：声音有大小，那计算机是怎么“听到”声音的？声音强度可以被转化成什么？",
          tips: "让学生尝试不同的声音（拍手、跺脚、说话、唱歌），观察数值变化范围。",
          warning: "避免学生大声喊叫，保护听力。"
        },
        {
          title: "搭建灯光台底座",
          duration: "7 分钟",
          content: "用彩色卡纸制作一个简单的灯罩，套在 K10 的 RGB LED 上，增强灯光视觉效果。可以用双面胶固定。学生可以发挥创意，制作不同形状的灯罩（圆形、星形、花朵等）。",
          tips: "灯罩不要完全封闭，需要留出散热空间。",
          warning: "确保灯罩不会遮挡 K10 的麦克风和屏幕。"
        },
        {
          title: "编写声音读取与灯光控制程序",
          duration: "15 分钟",
          content: "编写核心程序：读取麦克风的声音强度数据，将数据映射为 LED 的亮度和颜色。老师引导学生理解数据映射的概念——同样的声音强度，可以对应不同的灯光效果，这取决于我们怎么“翻译”这个数据。",
          tips: "先只实现亮度变化，颜色变化作为进阶功能。",
          warning: "麦克风数据需要做平滑处理，避免灯光闪烁过快。"
        },
        {
          title: "添加多种灯光模式",
          duration: "8 分钟",
          content: "在基础亮度映射之上，添加多种灯光模式：呼吸模式（灯光缓慢明暗变化）、闪烁模式（灯光快速开关）、彩虹模式（颜色循环变化）。学生可以通过按键切换不同模式。",
          tips: "每种模式对应不同的数学函数（正弦波、方波、线性循环），可以引导学生思考“函数决定形态”。",
          warning: "模式不要太多，3 种即可，避免学生混淆。"
        },
        {
          title: "举办班级灯光音乐会",
          duration: "7 分钟",
          content: "每个小组展示自己的音乐节奏灯光台，用拍手、唱歌或播放音乐控制灯光。全班一起举办一场“灯光音乐会”，评选“最佳视觉效果”“最佳创意”“最佳团队协作”等奖项。",
          tips: "鼓励学生用身体动作和声音配合灯光，增强多感官体验。",
          warning: "控制音量，避免影响其他班级。"
        }
      ],
      knowledgeExplanation: {
        coreConcept: "声音是一种机械波，通过空气传播。声音的强度（音量）可以用分贝（dB）来量化。在这个项目中，麦克风将声音波转化为电信号，再转化为数字数据。我们把这个数据映射为 LED 的亮度和颜色，实现了从“物理量”到“数字量”再到“物理输出”的完整转换。",
        keyFormula: "声音强度映射公式：\n\n亮度 = (声音强度 - 最小值) / (最大值 - 最小值) × 255\n\n其中：\n- 声音强度：麦克风读取的原始数据（0-4095）\n- 最小值/最大值：环境噪音和最大声音的范围\n- 255：LED 最大亮度\n\n颜色映射：\n- 冷色（蓝色）：声音强度低\n- 暖色（红色/橙色）：声音强度高\n- 中间色（绿色/黄色）：声音强度中等",
        inProject: "在音乐节奏灯光台中，麦克风读取的声音强度是输入数据，LED 的亮度和颜色是输出。学生通过改变声音大小，直接控制灯光效果。这种“输入-处理-输出”的结构是计算机科学和物理学的核心概念。",
        deepUnderstanding: "数据映射的本质是“翻译”——把一种语言（声音数据）翻译成另一种语言（灯光效果）。不同的映射规则会产生不同的“翻译结果”。这帮助学生理解：数据本身没有意义，是我们赋予它意义。同样的声音数据，可以映射为亮度、颜色、频率等不同的输出。",
        commonMisunderstanding: "误区1：认为麦克风“听到”的是和耳朵一样的东西。实际上麦克风只感知声波的振动强度，不感知音高或音色。误区2：认为声音强度和灯光亮度是“成正比”的。实际上映射关系是我们定义的，可以是线性的、指数的、对数的，取决于我们想要的效果。"
      },
      starterCodeCpp: "// 音乐节奏灯光台 - Arduino / ESP32 版本\n#include <Adafruit_NeoPixel.h>\n\n#define LED_PIN 6\n#define NUM_LEDS 1\n#define MIC_PIN A0\n\nAdafruit_NeoPixel pixels(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);\n\nint minVal = 100;\nint maxVal = 800;\n\nvoid setup() {\n  pixels.begin();\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  int micVal = analogRead(MIC_PIN);\n  int brightness = constrain(map(micVal, minVal, maxVal, 0, 255), 0, 255);\n  \n  // 颜色映射：冷色到暖色\n  int r = brightness;\n  int g = brightness * 0.6;\n  int b = 255 - brightness;\n  \n  pixels.setPixelColor(0, r, g, b);\n  pixels.show();\n  \n  Serial.print(\"Mic: \"); Serial.print(micVal);\n  Serial.print(\" Brightness: \"); Serial.println(brightness);\n  \n  delay(50);\n}",
      starterCodePython: "# 音乐节奏灯光台 - UNIHIKER K10 / MicroPython 版本\nimport time\nfrom pinpong.board import Board\n\nBoard().begin()\n\nmin_val = 100\nmax_val = 800\n\nwhile True:\n    # 读取麦克风数据\n    mic_val = Board().microphone[0]\n    \n    # 映射为亮度\n    brightness = max(0, min(255, (mic_val - min_val) * 255 // (max_val - min_val)))\n    \n    # 颜色映射：冷色到暖色\n    r = brightness\n    g = int(brightness * 0.6)\n    b = 255 - brightness\n    \n    # 设置 LED\n    Board().rgb[0] = (r, g, b)\n    \n    # 屏幕显示\n    Board().display.fill(0)\n    Board().display.draw_text(10, 20, f\"Sound: {mic_val}\", color=(255,255,255), size=2)\n    Board().display.draw_text(10, 60, f\"Light: {brightness}\", color=(255,255,255), size=2)\n    Board().display.refresh()\n    \n    time.sleep(0.05)",
      masteryTraining: {
        basicPractice: {
          task: "拍手 3 次（小声、中声、大声），记录每次的声音强度数值和对应的 LED 亮度，验证映射关系是否正确。",
          hint: "小声对应低亮度+冷色，大声对应高亮度+暖色。",
          answer: "小声：mic≈200，brightness≈50，颜色偏蓝；中声：mic≈400，brightness≈128，颜色偏绿；大声：mic≈700，brightness≈230，颜色偏红。"
        },
        variationChallenge: {
          task: "如果把映射公式改为 brightness = micVal × 2，会发生什么？灯光效果会有什么变化？",
          hint: "同样的声音强度，新的公式会产生更大的亮度值。",
          answer: "亮度会更快达到最大值 255，中等声音就会让灯光最亮。这意味着灯光对声音更“敏感”，但也更容易“饱和”（达到最大值后不再变化）。"
        },
        reverseThinking: {
          task: "如果你想让灯光在安静时最亮、吵闹时最暗（反向映射），公式应该怎么写？",
          hint: "用 255 减去原来的亮度值。",
          answer: "brightness = 255 - ((micVal - minVal) × 255 // (maxVal - minVal))。这样安静时灯光最亮（白色），吵闹时灯光最暗（黑色）。"
        },
        comprehensiveApplication: {
          task: "设计一个“节能模式”：当声音持续 10 秒低于某个阈值时，灯光自动关闭。这需要用到什么新知识？",
          hint: "需要记录时间，判断声音是否持续低于阈值。",
          answer: "需要用到计时器和条件判断。伪代码：if micVal < threshold for 10 seconds: turn off LED。这引入了“时间”这个新的维度，让项目从单纯的“实时映射”升级为“智能控制”。"
        },
        transferQuestion: {
          task: "生活中还有哪些“输入数据→输出效果”的例子？请举出 2 个，并说明输入、处理和输出分别是什么。",
          hint: "想想空调、自动门、手机屏幕亮度调节等。",
          answer: "例1：空调。输入：温度传感器数据；处理：判断当前温度是否高于设定温度；输出：压缩机开启/关闭。例2：手机屏幕亮度。输入：光线传感器数据；处理：根据环境光强度计算屏幕亮度；输出：调整屏幕背光。"
        }
      },
      extensions: [
        "增加节拍检测功能：识别音乐的节奏，让灯光跟随节拍闪烁",
        "加入多 LED 模式：用多个 LED 组成灯带，实现更复杂的灯光效果",
        "制作“声音可视化仪”：在屏幕上绘制声音的波形图",
        "增加录音和回放功能：记录一段声音，然后用灯光“播放”这段声音",
        "设计“情绪灯光”：根据声音的音高和节奏，判断“情绪”并显示对应颜色"
      ],
      faq: [
        {
          question: "麦克风读数不稳定怎么办？",
          answer: "对连续 10 次读数取平均值来平滑数据。在代码中使用一个循环读取 10 次，计算平均值后再映射为灯光效果。"
        },
        {
          question: "学生只关注灯光效果，不关注声音数据怎么办？",
          answer: "在灯光效果稳定后，让学生闭上眼睛只听声音，猜测当前的灯光颜色和亮度。然后睁开眼睛验证猜测，这种“猜测-验证”过程会自然引导学生关注数据。"
        },
        {
          question: "课堂太吵，麦克风读数一直很高怎么办？",
          answer: "调整 minVal 和 maxVal 的范围，让当前环境的噪音成为“最小值”。或者让学生分组进行，每组轮流展示。"
        },
        {
          question: "没有 K10 可以用手机代替吗？",
          answer: "可以先用手机上的声音检测 App 或网页模拟器体验概念，但无法获得 LED 灯光的物理反馈。建议后续补充 K10 硬件体验。"
        }
      ]
    };

    export const demoInstruction = {
      projectName: "点球力度计分台",
      subtitle: "通过射门力度与得分反馈，理解一次函数 y = kx + b 中 k 和 b 的真实含义",
      imageKey: "reaction-trainer",
      meta: {
        studentLevel: "需要项目带着学",
        knowledgePoint: "一次函数",
        subject: "数学",
        interest: "球星点球大战",
        hardware: "UNIHIKER K10",
        timeRequired: "60 分钟项目课",
        projectType: "STEAM 硬件学习项目"
      },
      overview: {
        coreGoal: "通过射门力度（输入 x）和得分反馈（输出 y）的真实互动，让学生直观理解一次函数 y = kx + b 中斜率 k 和截距 b 的物理含义，而不是只停留在纸面公式上。",
        projectIntro: "学生将使用 UNIHIKER K10 制作一个“点球力度计分台”。通过倾斜 K10 模拟射门力度，加速度传感器读取倾斜角度作为输入 x，系统根据一次函数 y = kx + b 计算得分 y，屏幕实时显示得分，RGB LED 用不同颜色表示“被扑出”“进球”“世界波”三个等级，扬声器播放对应音效。",
        whyFun: "它像一场真实的点球大战——学生倾斜身体控制力度，屏幕实时显示得分，灯光和声音给出即时反馈。力度太大太弱都不行，学生需要找到“最佳射门区间”，这本身就是一次函数的核心体验。",
        learningReasons: [
          "力度 x 和得分 y 之间是严格的线性关系，学生通过多次射门自然发现这个规律",
          "改变 k 值（难度系数）会直接影响得分曲线的陡峭程度，学生能直观感受斜率的作用",
          "截距 b 代表“最低保底分”，学生能理解即使力度为 0 也有基础分",
          "通过记录多次射门数据并绘制散点图，学生能从数据中自己“发现”一次函数",
          "不同等级的反馈（被扑出/进球/世界波）帮助学生理解函数值域和区间划分"
        ]
      },
      interactionFlow: {
        trigger: "学生手持 K10 倾斜身体模拟射门，加速度传感器读取 X 轴倾斜角度（-90° 到 +90°）作为输入 x",
        calculation: "将倾斜角度映射为 0-100 的力度值，代入一次函数 y = 0.8x + 15 计算得分，其中 k=0.8 是难度系数，b=15 是保底分",
        feedback: [
          "K10 屏幕实时显示力度值、得分和等级（被扑出 / 进球 / 世界波）",
          "RGB LED 三色反馈：红色=被扑出（y<40），绿色=进球（40≤y≤80），金色=世界波（y>80）",
          "扬声器播放对应音效：叹气声、欢呼声、全场欢呼"
        ],
        level: "Level 4 生态闭环",
        levelReason: "项目通过加速度传感器感知身体动作，经过一次函数计算后，同时驱动屏幕、灯光和声音三种反馈，形成完整的感知-计算-行动闭环。学生通过身体参与直接影响输出结果。"
      },
      materials: [
        { name: "UNIHIKER K10", quantity: "1 块", usage: "主控板，提供加速度传感器输入、屏幕显示、RGB LED 和扬声器反馈", note: "免接线，开箱即用" },
        { name: "USB Type-C 数据线", quantity: "1 根", usage: "供电和程序上传", note: "常规数据线即可" },
        { name: "纸板 / 亚克力板", quantity: "1 块", usage: "制作点球门框背景，增强场景代入感", note: "可打印足球门图片贴在纸板上" },
        { name: "A4 打印纸", quantity: "2 张", usage: "打印数据记录表和函数图像坐标纸", note: "学生用于记录射门数据和绘制函数图像" },
        { name: "彩色马克笔", quantity: "若干", usage: "在坐标纸上标注数据点和绘制函数曲线", note: "不同颜色区分不同 k 值的曲线" }
      ],
      steps: [
        {
          title: "理解一次函数的核心问题",
          duration: "10 分钟",
          content: "老师先提出问题：“如果你射门力度越大，得分会怎么变化？是成正比吗？有没有最低分？”让学生讨论力度和得分之间可能的关系。然后引出一次函数 y = kx + b，说明 k 控制增长速度，b 是保底分。",
          tips: "不要急着给出公式，先让学生猜测力度和得分的关系。",
          warning: "注意先完成基础版，不要一开始做太复杂。"
        },
        {
          title: "搭建点球门场景",
          duration: "10 分钟",
          content: "用纸板或亚克力板制作一个简单的足球门框背景，贴在桌面上。把 K10 放在“罚球点”位置，让学生可以手持 K10 进行“射门”动作。连接 USB 供电。",
          tips: "场景布置越有代入感，学生参与度越高。可以打印一张足球场的俯视图。",
          warning: "确保 K10 放置稳固，避免在倾斜操作时滑落。"
        },
        {
          title: "编写力度读取与得分计算程序",
          duration: "15 分钟",
          content: "编写核心程序：读取加速度传感器的 X 轴数据，将倾斜角度映射为 0-100 的力度值，代入 y = 0.8x + 15 计算得分。在屏幕上显示力度值和得分。老师引导学生理解每一行代码和一次函数的对应关系。",
          tips: "先只显示数字，不加灯光和声音，让学生专注于数据和函数关系。",
          warning: "加速度数据需要做平滑处理（取平均值），避免抖动导致得分跳动。"
        },
        {
          title: "添加等级反馈：灯光与声音",
          duration: "10 分钟",
          content: "根据得分划分三个等级：y < 40 为“被扑出”（红色 LED + 叹气声），40 ≤ y ≤ 80 为“进球”（绿色 LED + 欢呼声），y > 80 为“世界波”（金色 LED + 全场欢呼）。让学生体验不同力度对应不同反馈。",
          tips: "等级划分本身就是函数值域的概念，可以引导学生思考为什么选择 40 和 80 作为分界点。",
          warning: "扬声器音量不要太大，避免影响其他小组。"
        },
        {
          title: "射门挑战与数据记录",
          duration: "10 分钟",
          content: "每个学生进行 10 次射门，记录每次的力度值 x 和得分 y。在坐标纸上标注数据点，观察点的分布趋势。老师引导学生思考：这些点是否在一条直线上？为什么？",
          tips: "让学生自己发现数据点近似在一条直线上，这比直接告诉他们更有说服力。",
          warning: "确保每个学生都有机会动手操作，不要只让一个人玩。"
        },
        {
          title: "改变参数，观察规律变化",
          duration: "5 分钟",
          content: "老师修改 k 值（如从 0.8 改为 0.5 或 1.2），让学生再次射门并记录数据。对比两次数据的函数图像，讨论 k 值变化对得分曲线的影响。这帮助学生理解斜率的几何含义。",
          tips: "用不同颜色的笔绘制不同 k 值的曲线，视觉对比更直观。",
          warning: "时间有限，每组只改一次 k 值即可。"
        }
      ],
      knowledgeExplanation: {
        coreConcept: "一次函数 y = kx + b 描述的是两个变量之间的正比例关系加上一个偏移量。在这个项目中，x 是射门力度，y 是得分。k 决定了力度变化对得分的影响程度——k 越大，同样的力度变化会导致更大的得分变化。b 是截距，代表即使力度为 0 时的保底得分。",
        keyFormula: "y = kx + b\n\n其中：\n- x：射门力度（0-100）\n- y：得分（15-95）\n- k = 0.8：难度系数（斜率）\n- b = 15：保底分（截距）\n\n当 k = 0.8 时：y = 0.8 × 50 + 15 = 55 分\n当 k = 0.5 时：y = 0.5 × 50 + 15 = 40 分\n当 k = 1.2 时：y = 1.2 × 50 + 15 = 75 分",
        inProject: "在点球计分台中，力度 x 通过加速度传感器读取，得分 y 通过函数计算得出。学生每次射门都能看到具体的 x 值和 y 值，并通过多次射门发现 y 随 x 线性增长的规律。当老师改变 k 值时，同样的力度产生不同的得分，学生能直观感受斜率的作用。",
        deepUnderstanding: "一次函数的本质是“均匀变化”——x 每增加 1，y 就固定增加 k。这意味着得分的变化是可预测的。学生可以通过这个理解，预测“如果我用力 70，大概能得多少分”，然后再用实际射门验证预测。这种“预测-验证”过程就是科学思维的起点。",
        commonMisunderstanding: "误区1：认为 k 和 b 的数值不重要，随便设就行。实际上 k 和 b 决定了游戏的难度和体验——k 太大则得分对力度过于敏感，k 太小则力度变化几乎不影响得分。误区2：混淆自变量和因变量。在这个项目中，力度 x 是学生控制的（自变量），得分 y 是系统计算的（因变量），不能反过来。"
      },
      starterCodeCpp: "// 点球力度计分台 - Arduino / ESP32 版本\n#include <Wire.h>\n#include <Adafruit_SSD1306.h>\n#include <Adafruit_NeoPixel.h>\n\n#define SCREEN_W 128\n#define SCREEN_H 64\n#define LED_PIN 6\n#define NUM_LEDS 1\n\nAdafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);\nAdafruit_NeoPixel pixels(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);\n\nconst float k = 0.8;\nconst float b = 15;\n\nvoid setup() {\n  Serial.begin(115200);\n  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);\n  display.clearDisplay();\n  pixels.begin();\n}\n\nvoid loop() {\n  int rawX = analogRead(A0);\n  float x = constrain(map(rawX, 0, 1023, 0, 100), 0, 100);\n  float y = k * x + b;\n\n  // 屏幕显示\n  display.clearDisplay();\n  display.setTextSize(1);\n  display.setTextColor(SSD1306_WHITE);\n  display.setCursor(0, 0);\n  display.print(\"Power: \"); display.print((int)x);\n  display.setCursor(0, 16);\n  display.print(\"Score: \"); display.print((int)y);\n  display.setCursor(0, 40);\n  if (y < 40) display.print(\"SAVED!\");\n  else if (y <= 80) display.print(\"GOAL!\");\n  else display.print(\"WORLD CLASS!\");\n  display.display();\n\n  // LED 反馈\n  if (y < 40) pixels.setPixelColor(0, 255, 0, 0);\n  else if (y <= 80) pixels.setPixelColor(0, 0, 255, 0);\n  else pixels.setPixelColor(0, 255, 200, 0);\n  pixels.show();\n\n  delay(100);\n}",
      starterCodePython: "# 点球力度计分台 - UNIHIKER K10 / MicroPython 版本\nimport time\nfrom unihiker import Audio\nfrom pinpong.board import Board\n\nBoard().begin()\naudio = Audio()\n\nk = 0.8\nb = 15\n\nwhile True:\n    # 读取加速度传感器 X 轴\n    ax = Board().accelerometer[0]\n    # 映射为 0-100 的力度值\n    x = max(0, min(100, (ax + 1) * 50))\n    # 计算得分\n    y = k * x + b\n    y = max(0, min(100, y))\n\n    # 屏幕显示\n    Board().display.fill(0)\n    Board().display.draw_text(10, 20, f\"Power: {x:.0f}\", color=(255,255,255), size=2)\n    Board().display.draw_text(10, 60, f\"Score: {y:.0f}\", color=(255,255,255), size=2)\n\n    if y < 40:\n        Board().display.draw_text(10, 100, \"SAVED!\", color=(255,80,80), size=2)\n        Board().rgb[0] = (255, 0, 0)\n    elif y <= 80:\n        Board().display.draw_text(10, 100, \"GOAL!\", color=(80,255,80), size=2)\n        Board().rgb[0] = (0, 255, 0)\n    else:\n        Board().display.draw_text(10, 100, \"WORLD CLASS!\", color=(255,200,0), size=2)\n        Board().rgb[0] = (255, 200, 0)\n\n    Board().display.refresh()\n    time.sleep(0.1)",
      masteryTraining: {
        basicPractice: {
          task: "用力 30、50、70 分别射门 3 次，记录每次得分，验证 y = 0.8x + 15 的计算是否正确。",
          hint: "对比实际得分和公式计算得分，误差应该在 ±2 分以内。",
          answer: "x=30 时 y=39，x=50 时 y=55，x=70 时 y=71。如果实际得分接近这些值，说明函数关系成立。"
        },
        variationChallenge: {
          task: "如果教练把难度系数 k 从 0.8 改为 0.5，同样的力度 60，得分会变成多少？这对射门策略有什么影响？",
          hint: "代入 y = 0.5 × 60 + 15 计算，然后和原来的 y = 0.8 × 60 + 15 对比。",
          answer: "k=0.5 时 y=45（进球），k=0.8 时 y=63（进球）。k 变小后得分增长变慢，需要更大的力度才能达到世界波。射门策略需要更用力。"
        },
        reverseThinking: {
          task: "如果你想稳定得到“世界波”（得分 > 80），力度 x 至少要达到多少？（当前 k=0.8, b=15）",
          hint: "设 y > 80，代入 y = 0.8x + 15，解不等式求 x 的最小值。",
          answer: "0.8x + 15 > 80 → 0.8x > 65 → x > 81.25。力度至少要达到 82 才能稳定获得世界波。"
        },
        comprehensiveApplication: {
          task: "如果游戏规则改为：力度太小（x < 20）直接出界不得分，力度太大（x > 90）也射飞不得分。如何用一次函数和条件判断描述这个新规则？",
          hint: "先判断 x 是否在 20-90 范围内，如果在范围内则计算 y = kx + b，否则 y = 0。",
          answer: "这是一个分段函数：当 x < 20 或 x > 90 时 y = 0；当 20 ≤ x ≤ 90 时 y = 0.8x + 15。这帮助学生理解函数的定义域限制。"
        },
        transferQuestion: {
          task: "生活中还有哪些“输入和输出成线性关系”的例子？请举出 2 个，并写出对应的函数。",
          hint: "想想出租车计费、手机话费、水电费等生活中“有一个基础费用 + 按量计费”的场景。",
          answer: "例1：出租车费 = 2.3 × 公里数 + 13（起步价）。例2：电费 = 0.56 × 用电量 + 0（无基础费时）。这些本质上都是一次函数 y = kx + b 的应用。"
        }
      },
      extensions: [
        "增加双人模式：两个学生轮流射门，比较总分",
        "加入“最佳射门区间”分析：统计 10 次射门的得分标准差",
        "让学生自己设计 k 和 b 的值，创造不同难度的游戏",
        "增加“风速干扰”：随机加减一个值模拟风速，引入随机变量概念",
        "将数据导出到 Excel，用散点图和趋势线验证一次函数关系"
      ],
      faq: [
        {
          question: "加速度传感器读数不稳定怎么办？",
          answer: "对连续 5 次读数取平均值来平滑数据。在代码中使用一个长度为 5 的队列，每次读取新值时去掉最旧的值，计算平均值。"
        },
        {
          question: "学生只关注射门游戏，不关注函数怎么办？",
          answer: "在射门挑战后加入“预测环节”——让学生先预测某个力度会得多少分，再用实际射门验证。预测和验证的落差会自然引导学生关注函数关系。"
        },
        {
          question: "课堂时间不够完成全部步骤怎么办？",
          answer: "核心步骤是第 3-5 步（编写程序、添加反馈、射门记录）。如果时间紧张，可以跳过第 6 步（改变参数），将其作为课后拓展任务。"
        },
        {
          question: "没有 K10 可以用其他硬件吗？",
          answer: "可以用 Arduino + MPU6050 加速度传感器 + OLED 屏幕实现相同功能。代码逻辑完全一样，只是传感器读取方式不同。"
        }
      ]
    };

    /* ===== Material maps (mirrors backend) ===== */
