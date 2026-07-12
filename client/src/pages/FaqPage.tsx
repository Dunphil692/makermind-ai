import { useMemo, useState } from "react";
import { Footer, Layout } from "../components/Layout";

const FAQ_ITEMS = [
  { cat: "开始使用", q: "MakerMind AI 适合什么学科？", a: "支持数学、科学、物理、信息技术和综合实践等，只要想通过动手实践理解知识点都适用。" },
  { cat: "开始使用", q: "我需要会编程才能使用吗？", a: "不需要。输入知识点、兴趣场景和硬件条件即可，AI 会生成完整方案和带注释的代码。" },
  { cat: "硬件相关", q: "必须使用 UNIHIKER K10 吗？", a: "不是。支持 K10、Arduino、micro:bit、纸电路等多种方案。" },
  { cat: "技术实现", q: "数据存在哪里？", a: "使用 Cloudflare D1 边缘数据库，API 通过 Pages Functions 提供。" }
];

export function FaqPage() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return FAQ_ITEMS;
    return FAQ_ITEMS.filter((item) => item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle));
  }, [q]);

  return (
    <Layout showContest>
      <main className="page-main faq-page page-shell">
        <section className="page-hero compact left-hero">
          <span className="eyebrow">FAQ</span>
          <h1>常见问题</h1>
        </section>
        <div className="faq-search" style={{ marginBottom: 28 }}>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索常见问题..."
            style={{ width: "100%", padding: "14px 18px", borderRadius: 999 }}
          />
        </div>
        <div className="faq-grid">
          <div className="faq-category">
            {filtered.map((item) => (
              <details className="faq-item" key={item.q} open>
                <summary>{item.q}</summary>
                <div className="faq-answer">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
            {filtered.length === 0 && <p>没有找到匹配的问题</p>}
          </div>
        </div>
      </main>
      <Footer />
    </Layout>
  );
}
