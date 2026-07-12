export interface TaskBrief {
  studentInterest: string;
  hardwareKit: string;
  knowledgeGoal: string;
  subject: string;
  level: string;
  duration: string;
  confidence: {
    studentInterest: number;
    hardwareKit: number;
    knowledgeGoal: number;
  };
  missingFields: string[];
  readyToGenerate: boolean;
}

export interface DialogueMessage {
  role: "user" | "assistant";
  content: string;
}

export interface MaterialItem {
  name: string;
  quantity: string;
  usage: string;
  note?: string;
}

export interface StepItem {
  title: string;
  duration: string;
  content: string;
  tips?: string;
  warning?: string;
}

export interface TrainingItem {
  task?: string;
  hint?: string;
  answer?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface InstructionPartOverview {
  projectName?: string;
  subtitle?: string;
  imageKey?: string;
  meta?: Record<string, string>;
  overview?: {
    coreGoal?: string;
    teacherHook?: string;
    projectIntro?: string;
    whyFun?: string;
    learningReasons?: string[];
  };
  interactionFlow?: {
    trigger?: string;
    calculation?: string;
    feedback?: string[];
    level?: string;
    levelReason?: string;
  };
  materials?: MaterialItem[];
}

export interface InstructionPartBuild {
  steps?: StepItem[];
  knowledgeExplanation?: {
    coreConcept?: string;
    keyFormula?: string;
    inProject?: string;
    deepUnderstanding?: string;
    commonMisunderstanding?: string;
  };
  starterCodeCpp?: string;
  starterCodePython?: string;
  starterCode?: string;
}

export interface InstructionPartPractice {
  masteryTraining?: {
    basicPractice?: TrainingItem;
    variationChallenge?: TrainingItem;
    reverseThinking?: TrainingItem;
    comprehensiveApplication?: TrainingItem;
    transferQuestion?: TrainingItem;
  };
  extensions?: string[];
  faq?: FaqItem[];
}

export interface Instruction
  extends InstructionPartOverview,
    InstructionPartBuild,
    InstructionPartPractice {
  _degradedParts?: string[];
  _cloudId?: string;
  _studentProjectId?: string;
  _assignedStudentId?: string;
}

export interface GenerationPayload {
  concept: string;
  subject: string;
  level: string;
  interest: string;
  kit: string;
  duration: string;
  materials: string;
  studentId?: string;
}

export interface GenerationDraft {
  parts: Partial<Record<"overview" | "build" | "practice", unknown>>;
  degradedParts: string[];
  warnings: string[];
}

export interface HistoryItem {
  id: string;
  concept: string;
  interest: string;
  kit: string;
  duration: string;
  projectName?: string;
  createdAt: string;
  instruction: Instruction;
}

export interface StudentOption {
  studentId: string;
  name: string;
  interestDirection?: string | string[];
}

export type ResultView =
  | { kind: "waiting" }
  | { kind: "progress"; step: number; total: number; title: string; desc: string; draft: GenerationDraft }
  | { kind: "instruction"; instruction: Instruction; isRealGeneration: boolean }
  | { kind: "error"; message: string; retainedParts: number };
