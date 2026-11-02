import type { BatchPlanResult } from "./batch-plan";

export type DemoRole = "supervisor" | "planner" | "sponsor";

export function canRoleRelease(role: DemoRole): boolean {
  return role === "supervisor";
}

export function canRoleEditPlan(role: DemoRole): boolean {
  return role === "supervisor" || role === "planner";
}

export function canRoleRecordWaste(role: DemoRole): boolean {
  return role === "supervisor";
}

export function assertCanRelease(
  role: DemoRole,
  plan: BatchPlanResult,
  status: "draft" | "released" | "superseded",
): { ok: true } | { ok: false; code: string; messageEn: string; messageVi: string } {
  if (!canRoleRelease(role)) {
    return {
      ok: false,
      code: "FORBIDDEN",
      messageEn: "Only the production supervisor can release the plan.",
      messageVi: "Chỉ tổ trưởng sản xuất mới được phát hành kế hoạch.",
    };
  }
  if (status !== "draft") {
    return {
      ok: false,
      code: "INVALID_STATUS",
      messageEn: "Only a draft plan can be released.",
      messageVi: "Chỉ kế hoạch nháp mới được phát hành.",
    };
  }
  if (!plan.canRelease || plan.flags.includes("OVEN_OVER")) {
    return {
      ok: false,
      code: "OVEN_OVER",
      messageEn: "Oven load exceeds capacity. Apply the suggestion first.",
      messageVi: "Lò vượt công suất. Hãy áp dụng gợi ý trước.",
    };
  }
  return { ok: true };
}

export function detectOverrideQuestion(question: string): boolean {
  const q = question.toLowerCase();
  const patterns = [
    "set croissant",
    "đặt croissant",
    "change croissant",
    "increase croissant",
    "override",
    "500",
    "đặt số lượng",
    "thay đổi số lượng",
    "tăng croissant",
  ];
  return patterns.some((p) => q.includes(p));
}
