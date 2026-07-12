import { Link } from "react-router-dom";
import { Footer, Layout } from "../components/Layout";

export function AboutPage() {
  return (
    <Layout showContest>
      <main className="about-page">
        <section className="about-hero about-hero-compact">
          <span className="eyebrow">About · TRAE 参赛项目</span>
          <h1>60 秒，把知识点变成能上课的项目任务</h1>
          <p>
            MakerMind AI 输出<strong>学生任务卡、材料清单、课堂流程、代码思路与融会贯通训练</strong>——老师拿到就能进教室。
          </p>
          <div className="about-tag-row">
            <span>DeepSeek AI</span>
            <span>Cloudflare 全栈</span>
            <span>项目式学习</span>
            <span>UNIHIKER K10</span>
          </div>
          <div className="hero-actions">
            <Link className="btn primary" to="/generator">
              免费试生成
            </Link>
            <a className="btn ghost" href="https://github.com/Dunphil692/makermind-ai" target="_blank" rel="noopener noreferrer">
              查看开源仓库
            </a>
          </div>
        </section>
        <section className="about-shell about-stack">
          <article className="about-card">
            <h2>我们解决什么问题？</h2>
            <p>很多老师认同项目式学习，但备课成本高：要把知识点、学生兴趣、硬件条件和课堂时长拼成可执行方案，往往要花一整个下午。</p>
          </article>
          <article className="about-card">
            <h2>和普通 AI 备课工具有什么不同？</h2>
            <p>我们输出完整 STEAM 项目任务包，而不是泛泛的教案文字，并支持生成 → 布置 → 课堂记录 → 反馈的闭环。</p>
          </article>
        </section>
      </main>
      <Footer />
    </Layout>
  );
}
