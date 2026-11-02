import { prisma } from "@/lib/db";
import type { BatchPlanInput, SkuPlanInput } from "@/server/batch-plan";

const FIRM_DEMAND_CUTOFF = new Date("2026-11-01T00:00:00+07:00");
const KITCHEN_ID = "KIT-D3";

export async function loadPlanInput(forDate: string): Promise<BatchPlanInput> {
  const planDate = new Date(`${forDate}T00:00:00.000Z`);

  const [
    skus,
    signals,
    leftovers,
    yieldObs,
    recipes,
    ingredientStock,
    ovens,
  ] = await Promise.all([
    prisma.sku.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.demandSignal.findMany({
      where: { forDate: planDate },
    }),
    prisma.finishedOnHand.findMany({
      where: { outletId: KITCHEN_ID, asOf: new Date("2026-11-02") },
    }),
    prisma.yieldObservation.findMany(),
    prisma.recipe.findMany({ include: { lines: true } }),
    prisma.ingredientOnHand.findMany(),
    prisma.oven.findMany(),
  ]);

  const recipeBySku = new Map(recipes.map((r) => [r.skuId, r]));
  const leftoverBySku = new Map(leftovers.map((l) => [l.skuId, l.qty]));
  const yieldBySku = new Map<string, typeof yieldObs>();
  for (const y of yieldObs) {
    const list = yieldBySku.get(y.skuId) ?? [];
    list.push(y);
    yieldBySku.set(y.skuId, list);
  }

  const skuInputs: SkuPlanInput[] = skus.map((sku) => {
    const skuSignals = signals.filter((s) => s.skuId === sku.id);
    let demandQty = 0;
    let excludedStaleQty = 0;
    for (const sig of skuSignals) {
      if (sig.capturedAt >= FIRM_DEMAND_CUTOFF) {
        demandQty += sig.qty;
      } else {
        excludedStaleQty += sig.qty;
      }
    }

    const history = (yieldBySku.get(sku.id) ?? []).sort(
      (a, b) => a.eventDate.getTime() - b.eventDate.getTime(),
    );
    const recipe = recipeBySku.get(sku.id);

    return {
      skuId: sku.id,
      baked: sku.baked,
      batchMultiple: sku.batchMultiple,
      demandQty,
      excludedStaleQty,
      leftoverQty: leftoverBySku.get(sku.id) ?? 0,
      historyDays: history.length,
      yieldHistory: history.map((h) => ({
        producedQty: h.producedQty,
        wasteQty: h.wasteQty,
      })),
      recipe: recipe
        ? {
            yieldUnits: recipe.yieldUnits,
            lines: recipe.lines.map((l) => ({
              ingredientId: l.ingredientId,
              qtyPerYield: l.qtyPerYield,
            })),
          }
        : null,
    };
  });

  const ovenCapacity = ovens.reduce(
    (sum, o) => sum + o.decks * o.bakesPerDay,
    0,
  );

  return {
    skus: skuInputs,
    ingredientStock: ingredientStock.map((s) => ({
      ingredientId: s.ingredientId,
      qty: s.qty,
    })),
    ovenCapacity,
  };
}
