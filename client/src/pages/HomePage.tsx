import { Link } from "react-router-dom";
import { Footer, Layout } from "../components/Layout";
import { useEffect } from "react";

export function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document
      .querySelectorAll(
        ".learning-flow article, .output-grid article, .stats-grid .stat-card, .teacher-grid .teacher-card, .case-compare .case-card"
      )
      .forEach((el) => {
        el.classList.add("reveal-on-scroll");
        observer.observe(el);
      });
    return () => observer.disconnect();
  }, []);

  return (
    <Layout showContest>
      <main>
        <section className="clarity-hero page-shell">
          <div className="hero-overlay" />
          <div className="hero-decor hero-decor-1">⚡ 60秒生成</div>
          <div className="hero-decor hero-decor-2">🎯 项目式学习</div>
          <div className="hero-decor hero-decor-3">✨ 即开即用</div>
          <div className="clarity-hero-copy">
            <span className="eyebrow">TRAE AI 创造力大赛 · 学习工作赛道</span>
            <h1 className="hero-title">
              <span className="hero-title-line">把一个知识点，</span>
              <span className="hero-title-line">变成能上课的项目任务</span>
            </h1>
            <p>
              MakerMind AI 面向老师和科创机构：输入知识点、学生兴趣与课堂条件，60 秒生成可直接使用的
              STEAM 项目方案，包含任务卡、材料清单、代码示例、教师引导与分层训练。
            </p>
            <div className="hero-trust-row">
              <div className="trust-item">
                <strong>15 分钟</strong>
                <span>备课时间</span>
              </div>
              <div className="trust-item">
                <strong>8+</strong>
                <span>兴趣场景</span>
              </div>
              <div className="trust-item">
                <strong>5 层</strong>
                <span>训练梯度</span>
              </div>
              <div className="trust-item">
                <strong>2 种</strong>
                <span>代码语言</span>
              </div>
            </div>
            <div className="hero-actions">
              <Link className="btn primary" to="/generator">
                <span className="btn-icon">🚀</span>
                免费生成我的项目课
              </Link>
            </div>
          </div>
        </section>

        <section id="flow" className="page-shell clarity-flow-section">
          <div className="section-title left">
            <span>生成流程</span>
            <h2>
              从一个知识点，<br />
              生成一套可执行课堂任务
            </h2>
          </div>
          <div className="learning-flow">
            {[
              ["输入知识点", "输入课堂要学习的内容，例如一次函数、分数与比例、数据统计或科学原理。"],
              ["选择学生场景", "根据学生兴趣选择点球大战、篮球投篮、音乐节奏灯、环保监测等具体任务场景。"],
              ["匹配任务层次", "根据课堂时长和材料条件，生成网页模拟、低成本材料任务或硬件拓展项目。"],
              ["输出课堂材料", "系统输出学生任务卡、教师引导问题、材料清单、课堂流程和展示挑战。"]
            ].map(([title, body], i) => (
              <article key={title}>
                <span>{`0${i + 1}`}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="page-shell clarity-diff-section">
          <div className="section-title left">
            <span>为什么选择 MakerMind AI</span>
            <h2>不只是 AI 生成教案，而是生成可执行的课堂任务包</h2>
          </div>
          <div className="diff-table">
            <div className="diff-row diff-header">
              <div />
              <div>普通 AI 备课工具</div>
              <div className="diff-highlight">MakerMind AI</div>
            </div>
            {[
              ["输出内容", "文字教案、教学目标", "学生任务卡 + 教师引导卡 + 材料清单 + 代码 + 训练题"],
              ["硬件结合", "无硬件方案", "支持 K10 / Arduino / micro:bit / 纸电路，含可运行代码"],
              ["课堂可用性", "需二次加工", "含时间分配、材料数量、步骤提示，拿到手就能用"]
            ].map(([label, a, b]) => (
              <div className="diff-row" key={label}>
                <div className="diff-label">{label}</div>
                <div>{a}</div>
                <div className="diff-highlight">{b}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="page-shell clarity-final-cta">
          <div>
            <span className="eyebrow">MakerMind AI</span>
            <h2>让老师更快设计一节能体验、能动手、能展示的项目课</h2>
            <p>把学生先带入任务场景，再通过动手和展示解释知识点。</p>
          </div>
          <div className="cta-actions">
            <Link className="btn primary" to="/generator">
              生成课堂任务
            </Link>
            <Link className="btn ghost" to="/generator?demo=1">
              查看示例方案
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </Layout>
  );
}
