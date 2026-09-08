import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AI_FEATURES_PAUSED } from "../../config";
import { authFetch, getCurrentUser, isLoggedIn } from "../../lib/auth";
import { requestDialogueTurn, requestPart } from "./api";
import { canGenerateFromBrief, createEmptyBrief, fieldLabel, inferKitValue, normalizeClientBrief } from "./brief";
import { kitLabels, kitMaterials, GENERATION_STEPS } from "./constants";
import { demoInstruction, demoInstruction2 } from "./demoInstructions";
import { formatFetchError, getCurrentTimeText, instructionToPlainText } from "./helpers";
import { mergeParts } from "./mergeParts";
import {
  clearGenerationDraft,
  countDraftParts,
  deleteHistoryItem,
  DEMO_LOADED_KEY,
  getGenerationCacheKey,
  getHistory,
  getSaved,
  loadGenerationDraft,
  pruneGenerationDrafts,
  removeFromFavorites,
  saveGenerationDraft,
  saveHistory,
  saveToFavorites
} from "./storage";
import type {
  DialogueMessage,
  GenerationDraft,
  GenerationPayload,
  HistoryItem,
  Instruction,
  InstructionPartBuild,
  InstructionPartOverview,
  InstructionPartPractice,
  ResultView,
  StudentOption,
  TaskBrief
} from "./types";

export interface GeneratorFormState {
  concept: string;
  subject: string;
  level: string;
  kit: string;
  duration: string;
  interest: string;
}

const LEVEL_OPTIONS = ["需要项目带着学", "理解快，需要挑战", "兴趣低，需要强反馈"];

function buildPayload(form: GeneratorFormState, studentId: string): GenerationPayload {
  const kit = form.kit || "k10";
  return {
    concept: form.concept.trim() || "一次函数",
    subject: form.subject || "数学",
    level: form.level || LEVEL_OPTIONS[0],
    interest: form.interest.trim() || "球星点球大战",
    kit: kitLabels[kit] || kitLabels.k10,
    duration: form.duration || "60 分钟项目课",
    materials: kitMaterials[kit] || kitMaterials.k10,
    studentId: studentId || undefined
  };
}

function celebrateSuccess() {
  try {
    const overlay = document.createElement("div");
    overlay.className = "celebration-overlay";
    overlay.innerHTML = '<div class="celebration-toast">🎉 方案生成完成！</div>';
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 2800);

    const colors = ["#ff6b35", "#5b8def", "#00d4aa", "#ffc83f", "#ff5b5b", "#fb923c"];
    for (let i = 0; i < 40; i += 1) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.top = `${-(Math.random() * 40 + 10)}px`;
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.width = `${Math.random() * 8 + 6}px`;
      piece.style.height = `${Math.random() * 8 + 6}px`;
      piece.style.animationDelay = `${Math.random() * 0.6}s`;
      piece.style.animationDuration = `${Math.random() * 1.2 + 2.2}s`;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3200);
    }

    document.querySelector(".generator-result-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {
    /* non-critical */
  }
}

export function useGenerator() {
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState<GeneratorFormState>({
    concept: "一次函数",
    subject: "数学",
    level: LEVEL_OPTIONS[0],
    kit: "k10",
    duration: "60 分钟项目课",
    interest: ""
  });

  const [taskBrief, setTaskBrief] = useState<TaskBrief>(createEmptyBrief);
  const [dialogueMessages, setDialogueMessages] = useState<DialogueMessage[]>([]);
  const [dialogueInput, setDialogueInput] = useState("");
  const [isDialogueThinking, setIsDialogueThinking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(0);
  const [generateBtnLabel, setGenerateBtnLabel] = useState("信息完整后生成方案");
  const [resultView, setResultView] = useState<ResultView>({ kind: "waiting" });
  const [matchTag, setMatchTag] = useState("等待生成");
  const [updateTag, setUpdateTag] = useState("未调用 AI");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [activeDraftKey, setActiveDraftKey] = useState("");
  const [activeDraftInfo, setActiveDraftInfo] = useState<GenerationDraft | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [savedList, setSavedList] = useState<HistoryItem[]>([]);
  const [saveFlash, setSaveFlash] = useState(false);

  const payload = useMemo(() => buildPayload(form, selectedStudentId), [form, selectedStudentId]);
  const resultTitle = useMemo(
    () => `${payload.concept} × ${payload.interest}｜STEAM 项目方案`,
    [payload.concept, payload.interest]
  );

  const syncBriefFromForm = useCallback((brief: TaskBrief, nextForm: GeneratorFormState): TaskBrief => {
    const kitLabel = kitLabels[nextForm.kit] || kitLabels.k10;
    return normalizeClientBrief({
      ...brief,
      studentInterest: nextForm.interest.trim() || brief.studentInterest,
      hardwareKit: kitLabel,
      knowledgeGoal: nextForm.concept.trim() || brief.knowledgeGoal,
      subject: nextForm.subject,
      level: nextForm.level,
      duration: nextForm.duration,
      confidence: {
        studentInterest: nextForm.interest.trim() ? 0.92 : brief.confidence.studentInterest,
        hardwareKit: 0.92,
        knowledgeGoal: nextForm.concept.trim() ? 0.92 : brief.confidence.knowledgeGoal
      }
    });
  }, []);

  const applyBriefToForm = useCallback((brief: TaskBrief) => {
    setForm((prev) => ({
      ...prev,
      concept: brief.knowledgeGoal || prev.concept,
      interest: brief.studentInterest || prev.interest,
      subject: brief.subject || prev.subject,
      level: brief.level || prev.level,
      duration: brief.duration || prev.duration,
      kit: inferKitValue(brief.hardwareKit)
    }));
  }, []);

  const setWaitingView = useCallback(() => {
    setMatchTag("等待生成");
    setUpdateTag("未调用 AI");
    setResultView({ kind: "waiting" });
  }, []);

  const showInstruction = useCallback((instruction: Instruction, isReal: boolean) => {
    setMatchTag("完整方案");
    setUpdateTag(
      isReal
        ? `已生成 ${generateCount + (isReal ? 1 : 0)} 次 · ${getCurrentTimeText()}`
        : `示例方案 · ${getCurrentTimeText()}`
    );
    if (instruction._degradedParts?.length) {
      setUpdateTag(`含基础兜底 · ${getCurrentTimeText()}`);
    }
    setResultView({ kind: "instruction", instruction, isRealGeneration: isReal });
  }, [generateCount]);

  const generate = useCallback(async () => {
    if (AI_FEATURES_PAUSED || isGenerating || !canGenerateFromBrief(taskBrief)) return;
    setIsGenerating(true);
    setGenerateBtnLabel("正在生成...");

    const currentPayload = buildPayload(form, selectedStudentId);
    let draftKey = "";
    let draft: GenerationDraft = { parts: {}, degradedParts: [], warnings: [] };

    try {
      draftKey = getGenerationCacheKey(currentPayload);
      setActiveDraftKey(draftKey);
      draft = loadGenerationDraft(draftKey);
      setActiveDraftInfo(draft);

      async function ensurePart(
        part: "overview" | "build" | "practice",
        step: number,
        title: string,
        desc: string
      ) {
        const hasPart = Boolean(draft.parts[part]);
        setGenerateBtnLabel(hasPart ? `恢复 ${step}/3...` : `正在生成 ${step}/3...`);
        setMatchTag(`AI 生成中 ${step}/3`);
        setUpdateTag(`生成中 ${getCurrentTimeText()}`);
        setResultView({
          kind: "progress",
          step,
          total: 3,
          title: hasPart ? `已恢复 ${step}/3：${title}` : `正在生成 ${step}/3：${title}`,
          desc: hasPart ? "这一段已从本地草稿恢复，将继续生成剩余内容。" : desc,
          draft
        });

        if (hasPart) return draft.parts[part];
        const result = await requestPart(currentPayload, part);
        draft.parts[part] = result.data;
        if (result.degraded && !draft.degradedParts.includes(part)) draft.degradedParts.push(part);
        if (result.warning) draft.warnings.push(result.warning);
        saveGenerationDraft(draftKey, draft);
        setActiveDraftInfo({ ...draft });
        return result.data;
      }

      const overview = (await ensurePart("overview", 1, GENERATION_STEPS[0].title, GENERATION_STEPS[0].desc)) as InstructionPartOverview;
      const build = (await ensurePart("build", 2, GENERATION_STEPS[1].title, GENERATION_STEPS[1].desc)) as InstructionPartBuild;
      const practice = (await ensurePart("practice", 3, GENERATION_STEPS[2].title, GENERATION_STEPS[2].desc)) as InstructionPartPractice;

      const instruction = mergeParts(overview, build, practice);
      instruction._degradedParts = draft.degradedParts || [];

      const historyItem: HistoryItem = {
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        concept: currentPayload.concept,
        interest: currentPayload.interest,
        kit: currentPayload.kit,
        duration: currentPayload.duration,
        projectName: instruction.projectName,
        createdAt: new Date().toISOString(),
        instruction
      };
      saveHistory(historyItem);

      if (isLoggedIn()) {
        try {
          const cloudRes = await authFetch("/api/projects", {
            method: "POST",
            body: JSON.stringify({ overview, build, practice, status: "draft" })
          });
          const cloudData = await cloudRes.json();
          if (cloudData?.id) {
            instruction._cloudId = cloudData.id;
            if (selectedStudentId) {
              const assignRes = await authFetch(`/api/students/${encodeURIComponent(selectedStudentId)}/projects`, {
                method: "POST",
                body: JSON.stringify({ projectId: cloudData.id })
              });
              if (assignRes.ok) {
                const assignData = await assignRes.json();
                instruction._studentProjectId = assignData.id;
                instruction._assignedStudentId = selectedStudentId;
              }
            }
          }
        } catch (cloudErr) {
          console.warn("云端保存或布置失败，方案已保存到本地：", cloudErr);
        }
      }

      setGenerateCount((c) => {
        const next = c + 1;
        setMatchTag("完整方案");
        setUpdateTag(
          instruction._degradedParts?.length
            ? `含基础兜底 · ${getCurrentTimeText()}`
            : `已生成 ${next} 次 · ${getCurrentTimeText()}`
        );
        setResultView({ kind: "instruction", instruction, isRealGeneration: true });
        return next;
      });

      celebrateSuccess();
      clearGenerationDraft(draftKey);
      setActiveDraftInfo(null);
      setActiveDraftKey("");
    } catch (error) {
      console.error(error);
      const message = formatFetchError(error);
      setMatchTag("生成失败");
      setUpdateTag(`失败 · ${getCurrentTimeText()}`);
      setResultView({
        kind: "error",
        message,
        retainedParts: countDraftParts(activeDraftInfo || draft)
      });
    } finally {
      setIsGenerating(false);
      setGenerateBtnLabel(
        canGenerateFromBrief(taskBrief) ? "生成 STEAM 项目方案" : "请先补全三项信息"
      );
    }
  }, [activeDraftInfo, form, isGenerating, selectedStudentId, showInstruction, taskBrief]);

  const sendDialogueMessage = useCallback(async () => {
    if (AI_FEATURES_PAUSED) return;
    const text = dialogueInput.trim();
    if (!text || isDialogueThinking) return;
    setDialogueInput("");
    const nextMessages: DialogueMessage[] = [...dialogueMessages, { role: "user", content: text }];
    setDialogueMessages(nextMessages);
    setIsDialogueThinking(true);

    try {
      const data = await requestDialogueTurn(nextMessages, taskBrief, selectedStudentId);
      const nextBrief = normalizeClientBrief(data.brief);
      setTaskBrief(nextBrief);
      applyBriefToForm(nextBrief);
      setDialogueMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: data.reply || "我已经更新了课堂需求信息。" }
      ]);
    } catch (error) {
      const message = (error as Error).message || "请稍后重试";
      setDialogueMessages((msgs) => [
        ...msgs,
        { role: "assistant", content: `我刚才没有成功理解这条需求：${message}。你可以换一种说法再发一次。` }
      ]);
    } finally {
      setIsDialogueThinking(false);
    }
  }, [applyBriefToForm, dialogueInput, dialogueMessages, isDialogueThinking, selectedStudentId, taskBrief]);

  const applyPreset = useCallback(
    (preset: { concept: string; interest: string; kit: string; duration: string }) => {
      const nextForm: GeneratorFormState = {
        ...form,
        concept: preset.concept,
        interest: preset.interest,
        kit: preset.kit,
        duration: preset.duration
      };
      setForm(nextForm);
      const nextBrief = normalizeClientBrief({
        studentInterest: preset.interest,
        hardwareKit: kitLabels[preset.kit] || kitLabels.k10,
        knowledgeGoal: preset.concept,
        subject: form.subject,
        level: form.level,
        duration: preset.duration,
        confidence: { studentInterest: 1, hardwareKit: 1, knowledgeGoal: 1 }
      });
      setTaskBrief(nextBrief);
      setDialogueMessages((msgs) => [
        ...msgs,
        { role: "user", content: `我想做${preset.interest}，使用${kitLabels[preset.kit]}，让学生学习${preset.concept}。` },
        {
          role: "assistant",
          content: "这组信息已经够了，我已整理成项目简报。你可以继续补充学生基础，或直接点击生成方案。"
        }
      ]);
      setWaitingView();
    },
    [form, setWaitingView]
  );

  const loadInstructionFromHistory = useCallback((item: HistoryItem) => {
    showInstruction(item.instruction, false);
    setHistoryOpen(false);
    setSavedOpen(false);
  }, [showInstruction]);

  const handleSave = useCallback((instruction: Instruction) => {
    const item: HistoryItem = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      concept: payload.concept,
      interest: payload.interest,
      kit: payload.kit,
      duration: payload.duration,
      projectName: instruction.projectName,
      createdAt: new Date().toISOString(),
      instruction
    };
    saveToFavorites(item);
    if (isLoggedIn() && instruction._cloudId) {
      authFetch(`/api/projects/${instruction._cloudId}/favorite`, { method: "POST" }).catch(console.warn);
    }
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  }, [payload]);

  const handleExport = useCallback((instruction: Instruction) => {
    const text = instructionToPlainText(instruction);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${instruction.projectName || "STEAM方案"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleShare = useCallback(() => {
    const params = new URLSearchParams({
      c: payload.concept,
      i: payload.interest,
      k: form.kit,
      d: payload.duration
    });
    setShareLink(`${window.location.origin}/generator?${params.toString()}`);
    setShareOpen(true);
  }, [form.kit, payload]);

  const handleRegenerate = useCallback(() => {
    if (AI_FEATURES_PAUSED) return;
    if (!window.confirm("确定要重新生成吗？当前方案会保留在历史记录中。")) return;
    clearGenerationDraft(activeDraftKey);
    setActiveDraftInfo(null);
    document.querySelector(".generator-result-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    void generate();
  }, [activeDraftKey, generate]);

  const updateForm = useCallback(
    (patch: Partial<GeneratorFormState>) => {
      setForm((prev) => {
        const next = { ...prev, ...patch };
        setTaskBrief((brief) => syncBriefFromForm(brief, next));
        if (resultView.kind === "waiting") setResultView({ kind: "waiting" });
        return next;
      });
    },
    [resultView.kind, syncBriefFromForm]
  );

  useEffect(() => {
    pruneGenerationDrafts();
    setDialogueMessages([
      {
        role: "assistant",
        content:
          "你好！我会像和你一起备课一样了解需求。请直接告诉我：学生最近喜欢什么？你想用什么硬件或材料？这节课最想让学生学会哪个知识点？"
      }
    ]);
  }, []);

  useEffect(() => {
    const params = searchParams;
    const nextForm = { ...form };
    let changed = false;

    if (params.has("c")) {
      nextForm.concept = params.get("c") || nextForm.concept;
      changed = true;
    }
    if (params.has("i")) {
      nextForm.interest = params.get("i") || "";
      changed = true;
    }
    if (params.has("k")) {
      nextForm.kit = params.get("k") || nextForm.kit;
      changed = true;
    }
    if (params.has("d")) {
      nextForm.duration = params.get("d") || nextForm.duration;
      changed = true;
    }
    if (params.has("prefill")) {
      setDialogueInput(params.get("prefill") || "");
      if (!nextForm.interest.trim()) nextForm.interest = params.get("prefill") || "";
      changed = true;
    }
    if (params.has("studentId")) setSelectedStudentId(params.get("studentId") || "");

    if (changed) {
      setForm(nextForm);
      setTaskBrief(
        normalizeClientBrief({
          studentInterest: nextForm.interest,
          hardwareKit: kitLabels[nextForm.kit] || kitLabels.k10,
          knowledgeGoal: nextForm.concept,
          subject: nextForm.subject,
          level: nextForm.level,
          duration: nextForm.duration,
          confidence: {
            studentInterest: nextForm.interest ? 0.92 : 0,
            hardwareKit: 0.92,
            knowledgeGoal: nextForm.concept ? 0.92 : 0
          }
        })
      );
    }

    const projectId = params.get("project");
    const forceDemo = params.has("demo");
    const demoCase = params.get("case");

    if (projectId && isLoggedIn()) {
      (async () => {
        try {
          const res = await authFetch(`/api/projects/${projectId}`);
          if (res.ok) {
            const data = await res.json();
            const proj = data.project;
            if (proj?.overview) {
              const loaded = mergeParts(proj.overview, proj.build || {}, proj.practice || {});
              loaded._cloudId = proj.id;
              showInstruction(loaded, false);
              return;
            }
          }
        } catch (e) {
          console.warn("加载云端项目失败：", e);
        }
        setWaitingView();
      })();
      return;
    }

    if (!localStorage.getItem(DEMO_LOADED_KEY) || forceDemo) {
      const demo = demoCase === "2" ? demoInstruction2 : demoInstruction;
      showInstruction(demo as Instruction, false);
      localStorage.setItem(DEMO_LOADED_KEY, "1");
    } else {
      setWaitingView();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    if (!isLoggedIn() || user?.role !== "teacher") return;
    authFetch("/api/students")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const list = (data?.students || []) as StudentOption[];
        if (list.length) setStudents(list);
        if (searchParams.get("studentId")) setSelectedStudentId(searchParams.get("studentId") || "");
      })
      .catch(console.warn);
  }, [searchParams]);

  useEffect(() => {
    if (historyOpen) setHistoryList(getHistory());
    if (savedOpen) setSavedList(getSaved());
  }, [historyOpen, savedOpen]);

  const briefItems = useMemo(
    () =>
      (["studentInterest", "hardwareKit", "knowledgeGoal"] as const).map((key) => ({
        key,
        label: fieldLabel(key),
        value: taskBrief[key],
        complete: Boolean(taskBrief[key])
      })),
    [taskBrief]
  );

  const generateDisabled = AI_FEATURES_PAUSED || isGenerating || !canGenerateFromBrief(taskBrief);
  const generateLabel = AI_FEATURES_PAUSED
    ? "AI 生成功能暂时暂停"
    : isGenerating
    ? generateBtnLabel
    : canGenerateFromBrief(taskBrief)
      ? "生成 STEAM 项目方案"
      : "请先补全三项信息";

  return {
    form,
    updateForm,
    taskBrief,
    briefItems,
    dialogueMessages,
    dialogueInput,
    setDialogueInput,
    isDialogueThinking,
    sendDialogueMessage,
    isGenerating,
    generateDisabled,
    generateLabel,
    generate,
    resultView,
    resultTitle,
    matchTag,
    updateTag,
    selectedStudentId,
    setSelectedStudentId,
    students,
    applyPreset,
    historyOpen,
    setHistoryOpen,
    savedOpen,
    setSavedOpen,
    shareOpen,
    setShareOpen,
    shareLink,
    historyList,
    savedList,
    loadInstructionFromHistory,
    deleteHistoryItem: (id: string) => {
      deleteHistoryItem(id);
      setHistoryList(getHistory());
    },
    removeSavedItem: (id: string) => {
      removeFromFavorites(id);
      setSavedList(getSaved());
    },
    handleSave,
    handleExport,
    handleShare,
    handleRegenerate,
    saveFlash,
    retryGenerate: generate,
    restartGenerate: () => {
      if (AI_FEATURES_PAUSED) return;
      clearGenerationDraft(activeDraftKey);
      setActiveDraftInfo(null);
      void generate();
    },
    generateCount
  };
}
