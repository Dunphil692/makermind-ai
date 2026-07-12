import { Footer, Layout } from "../components/Layout";
import { GeneratorControlPanel } from "../features/generator/components/GeneratorControlPanel";
import { GeneratorModals } from "../features/generator/components/GeneratorModals";
import { ResultPanel } from "../features/generator/components/ResultPanel";
import { useGenerator } from "../features/generator/useGenerator";

export function GeneratorPage() {
  const api = useGenerator();

  return (
    <Layout showContest>
      <main className="page-main page-shell">
        <section className="page-hero compact left-hero generator-intro">
          <span className="eyebrow">TASK GENERATOR</span>
          <h1>生成互动学习任务</h1>
          <p>
            输入知识点、学生兴趣和学习条件，MakerMind AI 会生成一套完整的 STEAM 项目指导方案，
            包含项目概述、制作步骤、知识讲解、代码思路和融会贯通训练。
          </p>
        </section>

        <section className="generator-layout">
          <GeneratorControlPanel api={api} />
          <ResultPanel api={api} />
        </section>
      </main>
      <GeneratorModals api={api} />
      <Footer />
    </Layout>
  );
}
