import type { AgentOutput } from "@/lib/ai/client";
import { extractIntegers } from "@/lib/ai/client";
import type { BatchPlanLine, BatchPlanResult } from "@/server/batch-plan";

export type AgentPlanLine = BatchPlanLine & {
  nameEn: string;
  nameVi: string;
};

export type AgentPlanContext = {
  forDate: string;
  lines: AgentPlanLine[];
  ovenLoad: number;
  ovenCapacity: number;
  flags: string[];
  humanSuggestion: BatchPlanResult["humanSuggestion"];
};

export type PlanMetric = "slots" | "plannedQty" | "ovenLoad";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function isSlotQuestion(question: string): boolean {
  const q = normalize(question);
  return (
    /\bslots?\b/.test(q) ||
    q.includes("cho lo") ||
    q.includes("slot lo") ||
    q.includes("bao nhieu cho")
  );
}

export function isPlannedQtyQuestion(question: string): boolean {
  const q = normalize(question);
  return (
    q.includes("planned qty") ||
    q.includes("planned quantity") ||
    q.includes("planned") ||
    q.includes("ke hoach") ||
    q.includes("san luong") ||
    q.includes("bao nhieu phan") ||
    q.includes("how many portions") ||
    q.includes("how many trays")
  );
}

export function isOvenLoadQuestion(question: string): boolean {
  const q = normalize(question);
  return (
    q.includes("oven load") ||
    q.includes("oven capacity") ||
    q.includes("over capacity") ||
    q.includes("tai lo") ||
    q.includes("cong suat lo") ||
    /\b30\s*\/\s*29\b/.test(q) ||
    (q.includes("load") && q.includes("oven"))
  );
}

export function detectPlanMetricQuestion(question: string): PlanMetric | null {
  if (isOvenLoadQuestion(question)) {
    return "ovenLoad";
  }
  if (isSlotQuestion(question)) {
    return "slots";
  }
  if (isPlannedQtyQuestion(question)) {
    return "plannedQty";
  }
  return null;
}

export function resolvePlanLineByQuestion(
  question: string,
  lines: AgentPlanLine[],
): AgentPlanLine | null {
  const q = normalize(question);
  const scored = lines
    .map((line) => {
      let score = 0;
      const skuLower = line.skuId.toLowerCase();
      if (q.includes(skuLower)) {
        score += 100;
      }
      const nameEn = normalize(line.nameEn);
      const nameVi = normalize(line.nameVi);
      if (nameEn.length > 0 && q.includes(nameEn)) {
        score += 60;
      }
      if (nameVi.length > 0 && q.includes(nameVi)) {
        score += 60;
      }
      for (const token of nameEn.split(/\s+/).filter((t) => t.length > 3)) {
        if (q.includes(token)) {
          score += 12;
        }
      }
      for (const token of nameVi.split(/\s+/).filter((t) => t.length > 2)) {
        if (q.includes(token)) {
          score += 12;
        }
      }
      return { line, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return null;
  }
  if (scored.length > 1 && scored[0]!.score === scored[1]!.score) {
    return null;
  }
  return scored[0]!.line;
}

function metricForQuestion(question: string, lines: AgentPlanLine[]): PlanMetric | null {
  const direct = detectPlanMetricQuestion(question);
  if (direct) {
    return direct;
  }
  const q = normalize(question);
  if (/\bhow many\b/.test(q) && resolvePlanLineByQuestion(question, lines)) {
    return "plannedQty";
  }
  return null;
}

export function tryAnswerDeterministicPlanQuestion(
  question: string,
  context: AgentPlanContext,
): AgentOutput | null {
  const metric = metricForQuestion(question, context.lines);
  if (!metric) {
    return null;
  }

  if (metric === "ovenLoad") {
    const over = context.ovenLoad > context.ovenCapacity;
    return {
      answer_en: `Oven load is ${context.ovenLoad}/${context.ovenCapacity} slots${over ? " (over capacity)" : ""}.`,
      answer_vi: `Tải lò là ${context.ovenLoad}/${context.ovenCapacity} chỗ${over ? " (vượt công suất)" : ""}.`,
      cited_sku_ids: [],
      flags: over ? ["OVEN_OVER"] : [],
    };
  }

  const line = resolvePlanLineByQuestion(question, context.lines);
  if (!line) {
    return null;
  }

  if (metric === "slots") {
    const slotWordEn = line.slots === 1 ? "slot" : "slots";
    return {
      answer_en: `The plan allocates ${line.slots} oven ${slotWordEn} to ${line.nameEn} (${line.skuId}).`,
      answer_vi: `Kế hoạch dành ${line.slots} chỗ lò cho ${line.nameVi} (${line.skuId}).`,
      cited_sku_ids: [line.skuId],
      flags: line.flags,
    };
  }

  return {
    answer_en: `The plan shows planned quantity ${line.plannedQty} for ${line.nameEn} (${line.skuId}).`,
    answer_vi: `Kế hoạch ghi ${line.plannedQty} phần cho ${line.nameVi} (${line.skuId}).`,
    cited_sku_ids: [line.skuId],
    flags: line.flags,
  };
}

/** @deprecated Use tryAnswerDeterministicPlanQuestion */
export function tryAnswerSlotQuestion(
  question: string,
  lines: AgentPlanLine[],
): AgentOutput | null {
  return tryAnswerDeterministicPlanQuestion(question, {
    forDate: "",
    lines,
    ovenLoad: 0,
    ovenCapacity: 0,
    flags: [],
    humanSuggestion: null,
  });
}

export function validateAgentSkuConsistency(
  output: AgentOutput,
  question: string,
  context: AgentPlanContext,
): boolean {
  const lines = context.lines;
  const metric = metricForQuestion(question, lines);
  const resolved = resolvePlanLineByQuestion(question, lines);
  if (!resolved && metric !== "ovenLoad") {
    return true;
  }

  const combined = `${output.answer_en} ${output.answer_vi}`.toLowerCase();

  if (resolved) {
    if (
      output.cited_sku_ids.length > 0 &&
      !output.cited_sku_ids.includes(resolved.skuId)
    ) {
      return false;
    }

    for (const line of lines) {
      if (line.skuId === resolved.skuId) {
        continue;
      }
      if (combined.includes(line.skuId.toLowerCase())) {
        return false;
      }
    }
  }

  if (metric === "slots" && resolved) {
    const nums = extractIntegers(combined);
    const wrongSlot = nums.find((n) =>
      lines.some((l) => l.slots === n && l.skuId !== resolved.skuId),
    );
    if (wrongSlot !== undefined && !nums.includes(resolved.slots)) {
      return false;
    }
  }

  if (metric === "plannedQty" && resolved) {
    const nums = extractIntegers(combined);
    const wrongPlanned = nums.find((n) =>
      lines.some((l) => l.plannedQty === n && l.skuId !== resolved.skuId),
    );
    if (wrongPlanned !== undefined && !nums.includes(resolved.plannedQty)) {
      return false;
    }
  }

  if (metric === "ovenLoad") {
    const nums = extractIntegers(combined);
    if (
      nums.includes(context.ovenLoad) === false ||
      nums.includes(context.ovenCapacity) === false
    ) {
      if (nums.some((n) => n === context.ovenLoad || n === context.ovenCapacity)) {
        return false;
      }
    }
  }

  return true;
}

export function buildAgentPlanContext(
  forDate: string,
  computed: BatchPlanResult,
  skuNames: Map<string, { nameEn: string; nameVi: string }>,
): AgentPlanContext {
  return {
    forDate,
    lines: computed.lines.map((line) => {
      const names = skuNames.get(line.skuId);
      return {
        ...line,
        nameEn: names?.nameEn ?? line.skuId,
        nameVi: names?.nameVi ?? line.skuId,
      };
    }),
    ovenLoad: computed.ovenLoad,
    ovenCapacity: computed.ovenCapacity,
    flags: computed.flags,
    humanSuggestion: computed.humanSuggestion,
  };
}
