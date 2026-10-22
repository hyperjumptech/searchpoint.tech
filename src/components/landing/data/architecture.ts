export type ArchitectureStepId =
  | "step-1"
  | "step-2"
  | "step-3"
  | "step-4"
  | "step-5";

export interface ArchitectureStep {
  id: ArchitectureStepId;
  stepNumber: string;
  titleKey: string;
  descKey: string;
  color: string; // "tenant" or hex code
}

export const ARCHITECTURE_STEPS: ArchitectureStep[] = [
  {
    id: "step-1",
    stepNumber: "01",
    titleKey: "step1.title",
    descKey: "step1.desc",
    color: "tenant",
  },
  {
    id: "step-2",
    stepNumber: "02",
    titleKey: "step2.title",
    descKey: "step2.desc",
    color: "#3b82f6",
  },
  {
    id: "step-3",
    stepNumber: "03",
    titleKey: "step3.title",
    descKey: "step3.desc",
    color: "#10b981",
  },
  {
    id: "step-4",
    stepNumber: "04",
    titleKey: "step4.title",
    descKey: "step4.desc",
    color: "#f59e0b",
  },
  {
    id: "step-5",
    stepNumber: "05",
    titleKey: "step5.title",
    descKey: "step5.desc",
    color: "#8b5cf6",
  },
];
