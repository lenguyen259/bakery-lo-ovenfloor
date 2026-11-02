export type YieldObservationInput = {
  producedQty: number;
  wasteQty: number;
};

export type RecipeLineInput = {
  ingredientId: string;
  qtyPerYield: number;
};

export type SkuPlanInput = {
  skuId: string;
  baked: boolean;
  batchMultiple: number;
  demandQty: number;
  excludedStaleQty: number;
  leftoverQty: number;
  historyDays: number;
  yieldHistory: YieldObservationInput[];
  recipe: {
    yieldUnits: number;
    lines: RecipeLineInput[];
  } | null;
};

export type IngredientStockInput = {
  ingredientId: string;
  qty: number;
};

export type BatchPlanInput = {
  skus: SkuPlanInput[];
  ingredientStock: IngredientStockInput[];
  ovenCapacity: number;
};

export type BatchPlanLine = {
  skuId: string;
  demandQty: number;
  excludedStaleQty: number;
  leftoverQty: number;
  wasteBufferQty: number;
  plannedQty: number;
  slots: number;
  constrainedBy: "ingredient" | "oven" | "none";
  flags: string[];
};

export type BatchPlanResult = {
  lines: BatchPlanLine[];
  ovenLoad: number;
  ovenCapacity: number;
  flags: string[];
  canRelease: boolean;
  humanSuggestion: { skuId: string; plannedQty: number; reason: string } | null;
};

const DEFAULT_RATE = 0.08;
const MAX_RATE = 0.25;

function median(values: number[]): number {
  if (values.length === 0) return DEFAULT_RATE;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function wasteRate(sku: SkuPlanInput): { rate: number; flags: string[] } {
  const flags: string[] = [];
  if (sku.historyDays < 5) {
    flags.push("LOW_HISTORY");
    return { rate: DEFAULT_RATE, flags };
  }
  const ratios = sku.yieldHistory.map((o) => o.wasteQty / o.producedQty);
  let rate = median(ratios);
  rate = Math.min(rate, MAX_RATE);
  return { rate, flags };
}

function planSkuBase(sku: SkuPlanInput): BatchPlanLine {
  const { rate, flags } = wasteRate(sku);
  const wasteBufferQty = Math.ceil(sku.demandQty * rate);
  const raw = sku.demandQty + wasteBufferQty - sku.leftoverQty;
  let plannedQty = 0;
  if (raw > 0) {
    plannedQty =
      Math.ceil(raw / sku.batchMultiple) * sku.batchMultiple;
  }
  const lineFlags = [...flags];
  if (sku.excludedStaleQty > 0) {
    lineFlags.push("STALE_DEMAND");
  }
  return {
    skuId: sku.skuId,
    demandQty: sku.demandQty,
    excludedStaleQty: sku.excludedStaleQty,
    leftoverQty: sku.leftoverQty,
    wasteBufferQty,
    plannedQty,
    slots: sku.baked ? plannedQty / sku.batchMultiple : 0,
    constrainedBy: "none",
    flags: lineFlags,
  };
}

function applyIngredientConstraint(
  line: BatchPlanLine,
  sku: SkuPlanInput,
  stock: Map<string, number>,
): BatchPlanLine {
  if (!sku.recipe || line.plannedQty <= 0) return line;
  const { yieldUnits, lines } = sku.recipe;
  let maxPlanned = line.plannedQty;
  for (const rl of lines) {
    const available = stock.get(rl.ingredientId) ?? 0;
    const needPerUnit = rl.qtyPerYield / yieldUnits;
    if (needPerUnit <= 0) continue;
    const fits = Math.floor(available / needPerUnit);
    const batchFits =
      Math.floor(fits / sku.batchMultiple) * sku.batchMultiple;
    maxPlanned = Math.min(maxPlanned, batchFits);
  }
  if (maxPlanned < line.plannedQty) {
    const flags = line.flags.includes("INGREDIENT")
      ? line.flags
      : [...line.flags, "INGREDIENT"];
    return {
      ...line,
      plannedQty: maxPlanned,
      slots: sku.baked ? maxPlanned / sku.batchMultiple : 0,
      constrainedBy: "ingredient",
      flags,
    };
  }
  return line;
}

export function buildBatchPlan(input: BatchPlanInput): BatchPlanResult {
  const stock = new Map(
    input.ingredientStock.map((s) => [s.ingredientId, s.qty]),
  );

  let lines = input.skus.map((sku) => {
    const base = planSkuBase(sku);
    return applyIngredientConstraint(base, sku, stock);
  });

  const ovenLoad = lines.reduce((sum, l) => sum + l.slots, 0);
  const flags: string[] = [];
  let canRelease = true;

  if (ovenLoad > input.ovenCapacity) {
    flags.push("OVEN_OVER");
    canRelease = false;
    lines = lines.map((l) => ({
      ...l,
      flags: l.flags.includes("OVEN_OVER") ? l.flags : [...l.flags, "OVEN_OVER"],
    }));
  }

  const humanSuggestion =
    flags.includes("OVEN_OVER")
      ? {
          skuId: "GN-QUE",
          plannedQty: 0,
          reason: "Reduce ginger biscuits to free oven slots",
        }
      : null;

  return {
    lines,
    ovenLoad,
    ovenCapacity: input.ovenCapacity,
    flags,
    canRelease,
    humanSuggestion,
  };
}

export function applyOvenSuggestion(
  plan: BatchPlanResult,
  skuInputs: SkuPlanInput[],
  skuId: string,
  newPlannedQty: number,
): BatchPlanResult {
  const inputMap = new Map(skuInputs.map((s) => [s.skuId, s]));
  const lines = plan.lines.map((line) => {
    if (line.skuId !== skuId) return line;
    const sku = inputMap.get(skuId);
    if (!sku) return line;
    return {
      ...line,
      plannedQty: newPlannedQty,
      slots: sku.baked ? newPlannedQty / sku.batchMultiple : 0,
      constrainedBy: "none" as const,
      flags: line.flags.filter((f) => f !== "OVEN_OVER"),
    };
  });
  const ovenLoad = lines.reduce((sum, l) => sum + l.slots, 0);
  const flags: string[] = [];
  let canRelease = true;
  if (ovenLoad > plan.ovenCapacity) {
    flags.push("OVEN_OVER");
    canRelease = false;
  }
  return {
    lines,
    ovenLoad,
    ovenCapacity: plan.ovenCapacity,
    flags,
    canRelease,
    humanSuggestion: canRelease ? null : plan.humanSuggestion,
  };
}
