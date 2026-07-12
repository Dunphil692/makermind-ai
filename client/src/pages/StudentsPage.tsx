import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Footer, Layout } from "../components/Layout";

const STUDENTS = [
  {
    name: "林一鸣",
    level: "需要项目带着学",
    interests: "游戏、运动、短视频",
    risk: "容易跳过解释，只关注作品能不能玩",
    suggestion: "推荐用反应训练舱或直播热度仪表盘作为入口，先让学生做出可玩的反馈，再要求他解释一次参数修改怎样影响分数、速度或灯效"
  },
  {
    name: "陈小雨",
    level: "理解快，需要挑战",
    interests: "动漫、编程、解谜",
    risk: "基础版太简单时会失去耐心",
    suggestion: "适合开放式优化任务，让学生自己设计规则变化或增加难度参数"
  },
  {
    name: "周可",
    level: "兴趣低，需要强反馈",
    interests: "音乐、短视频、美食",
    risk: "如果前 10 分钟没有效果，容易退出任务",
    suggestion: "优先选择灯光、声音或动作即时反馈强的项目入口"
  },
  {
    name: "王小明",
    level: "理解快，需要挑战",
    interests: "机器人、编程、竞赛",
    risk: "觉得基础任务太简单，容易分心去挑战更复杂的功能",
    suggestion: "可加入竞赛规则、排行榜或多传感器协同挑战"
  },
  {
    name: "张小华",
    level: "兴趣低，需要强反馈",
    interests: "绘画、手工、故事",
    risk: "对纯技术内容不感兴趣，需要从美学和故事角度切入",
    suggestion: "从视觉呈现、故事情境和作品展示切入，再回扣知识点"
  }
];

export function StudentsPage() {
  const [active, setActive] = useState(0);
  const student = useMemo(() => STUDENTS[active], [active]);

  return (
    <Layout showContest>
      <main className="page-shell page-main">
        <section className="page-hero compact left-hero">
          <span className="eyebrow">Student Profile</span>
          <h1>老师先看到学生，再看到项目</h1>
          <p>画像不是给学生贴标签，而是帮助老师选择合适的入口、难度、反馈方式和作品呈现</p>
        </section>
        <section className="dashboard-section">
          <aside className="dashboard-card">
            <span className="eyebrow">Class 7A</span>
            <h2>学生画像示例</h2>
            <div className="student-list">
              {STUDENTS.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  className={`student ${i === active ? "active" : ""}`}
                  onClick={() => setActive(i)}
                >
                  <strong>{s.name}</strong>
                  <span>{s.risk}</span>
                </button>
              ))}
            </div>
          </aside>
          <article className="dashboard-card detail-card">
            <span className="eyebrow">Selected student</span>
            <h2>{student.name}</h2>
            <div className="metric-grid">
              <div>
                <span>学习状态</span>
                <strong>{student.level}</strong>
              </div>
              <div>
                <span>兴趣偏向</span>
                <strong>{student.interests}</strong>
              </div>
              <div className="full">
                <span>可能卡点</span>
                <strong>{student.risk}</strong>
              </div>
            </div>
            <div className="ai-box">
              <span>AI 给老师的建议</span>
              <p>{student.suggestion}</p>
            </div>
            <div className="profile-actions">
              <Link className="btn primary" to="/generator">
                用这个画像生成项目
              </Link>
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </Layout>
  );
}
