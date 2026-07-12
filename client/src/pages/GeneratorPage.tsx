import { useEffect, useRef } from "react";
import { Footer, Layout } from "../components/Layout";
import { installLegacyAuthBridge } from "../lib/auth";
import { loadScript } from "../lib/utils";
import generatorShell from "../legacy/generator-shell.html?raw";

export function GeneratorPage() {
  const containerRef = useRef<HTMLElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    installLegacyAuthBridge();
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadScript("/legacy/generator.js?v=20260701b", "mm-generator-script").catch(console.error);
  }, []);

  return (
    <Layout showContest>
      <main
        ref={containerRef}
        className="page-main page-shell"
        dangerouslySetInnerHTML={{ __html: generatorShell }}
      />
      <Footer />
    </Layout>
  );
}
