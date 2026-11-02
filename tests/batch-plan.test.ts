import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyOvenSuggestion,
  buildBatchPlan,
  type BatchPlanInput,
  type SkuPlanInput,
} from "../src/server/batch-plan.ts";

const PLAN_DATE_SKUS: SkuPlanInput[] = [
  {
    skuId: "BM-PAT",
    baked: true,
    batchMultiple: 10,
    demandQty: 80,
    excludedStaleQty: 0,
    leftoverQty: 10,
    historyDays: 10,
    yieldHistory: Array.from({ length: 10 }, () => ({
      producedQty: 100,
      wasteQty: 5,
    })),
    recipe: {
      yieldUnits: 10,
      lines: [
        { ingredientId: "flour", qtyPerYield: 5 },
        { ingredientId: "water", qtyPerYield: 3 },
      ],
    },
  },
  {
    skuId: "CR-BUT",
    baked: true,
    batchMultiple: 12,
    demandQty: 96,
    excludedStaleQty: 0,
    leftoverQty: 8,
    historyDays: 14,
    yieldHistory: Array.from({ length: 14 }, () => ({
      producedQty: 100,
      wasteQty: 10,
    })),
    recipe: {
      yieldUnits: 12,
      lines: [
        { ingredientId: "flour", qtyPerYield: 4 },
        { ingredientId: "butter", qtyPerYield: 6 },
      ],
    },
  },
  {
    skuId: "TT-EGG",
    baked: true,
    batchMultiple: 12,
    demandQty: 48,
    excludedStaleQty: 0,
    leftoverQty: 0,
    historyDays: 10,
    yieldHistory: Array.from({ length: 10 }, () => ({
      producedQty: 100,
      wasteQty: 8,
    })),
    recipe: {
      yieldUnits: 12,
      lines: [
        { ingredientId: "flour", qtyPerYield: 3 },
        { ingredientId: "egg", qtyPerYield: 6 },
      ],
    },
  },
  {
    skuId: "BL-PAN",
    baked: true,
    batchMultiple: 8,
    demandQty: 24,
    excludedStaleQty: 0,
    leftoverQty: 0,
    historyDays: 10,
    yieldHistory: Array.from({ length: 10 }, () => ({
      producedQty: 100,
      wasteQty: 8,
    })),
    recipe: {
      yieldUnits: 8,
      lines: [
        { ingredientId: "flour", qtyPerYield: 4 },
        { ingredientId: "egg", qtyPerYield: 10 },
      ],
    },
  },
  {
    skuId: "SD-CAM",
    baked: true,
    batchMultiple: 6,
    demandQty: 18,
    excludedStaleQty: 12,
    leftoverQty: 0,
    historyDays: 8,
    yieldHistory: Array.from({ length: 8 }, () => ({
      producedQty: 100,
      wasteQty: 8,
    })),
    recipe: {
      yieldUnits: 6,
      lines: [
        { ingredientId: "flour", qtyPerYield: 5 },
        { ingredientId: "water", qtyPerYield: 2 },
      ],
    },
  },
  {
    skuId: "TR-LY",
    baked: true,
    batchMultiple: 8,
    demandQty: 16,
    excludedStaleQty: 0,
    leftoverQty: 16,
    historyDays: 6,
    yieldHistory: Array.from({ length: 6 }, () => ({
      producedQty: 100,
      wasteQty: 8,
    })),
    recipe: {
      yieldUnits: 8,
      lines: [
        { ingredientId: "cream", qtyPerYield: 4 },
        { ingredientId: "flour", qtyPerYield: 2 },
      ],
    },
  },
  {
    skuId: "GN-QUE",
    baked: true,
    batchMultiple: 6,
    demandQty: 12,
    excludedStaleQty: 0,
    leftoverQty: 0,
    historyDays: 3,
    yieldHistory: [
      { producedQty: 100, wasteQty: 8 },
      { producedQty: 100, wasteQty: 8 },
      { producedQty: 100, wasteQty: 8 },
    ],
    recipe: {
      yieldUnits: 6,
      lines: [
        { ingredientId: "flour", qtyPerYield: 3 },
        { ingredientId: "ginger", qtyPerYield: 2 },
      ],
    },
  },
  {
    skuId: "GQ-TET",
    baked: false,
    batchMultiple: 1,
    demandQty: 5,
    excludedStaleQty: 0,
    leftoverQty: 0,
    historyDays: 6,
    yieldHistory: Array.from({ length: 6 }, () => ({
      producedQty: 100,
      wasteQty: 0,
    })),
    recipe: {
      yieldUnits: 1,
      lines: [
        { ingredientId: "box", qtyPerYield: 1 },
        { ingredientId: "ribbon", qtyPerYield: 1 },
      ],
    },
  },
];

function baseInput(): BatchPlanInput {
  return {
    skus: PLAN_DATE_SKUS,
    ingredientStock: [
      { ingredientId: "flour", qty: 100000 },
      { ingredientId: "water", qty: 100000 },
      { ingredientId: "butter", qty: 100000 },
      { ingredientId: "egg", qty: 20 },
      { ingredientId: "cream", qty: 100000 },
      { ingredientId: "ginger", qty: 100000 },
      { ingredientId: "box", qty: 100000 },
      { ingredientId: "ribbon", qty: 100000 },
    ],
    ovenCapacity: 29,
  };
}

describe("buildBatchPlan", () => {
  it("plans croissant at 108 with 10% buffer", () => {
    const plan = buildBatchPlan(baseInput());
    const cr = plan.lines.find((l) => l.skuId === "CR-BUT");
    assert.ok(cr);
    assert.equal(cr.plannedQty, 108);
    assert.equal(cr.wasteBufferQty, 10);
  });

  it("cuts pandan to 16 because of 20 eggs", () => {
    const plan = buildBatchPlan(baseInput());
    const pan = plan.lines.find((l) => l.skuId === "BL-PAN");
    assert.ok(pan);
    assert.equal(pan.plannedQty, 16);
    assert.ok(pan.flags.includes("INGREDIENT"));
  });

  it("plans ginger at 18 with LOW_HISTORY", () => {
    const plan = buildBatchPlan(baseInput());
    const gn = plan.lines.find((l) => l.skuId === "GN-QUE");
    assert.ok(gn);
    assert.equal(gn.plannedQty, 18);
    assert.ok(gn.flags.includes("LOW_HISTORY"));
  });

  it("keeps stale SD-CAM qty out of demand_qty", () => {
    const plan = buildBatchPlan(baseInput());
    const sd = plan.lines.find((l) => l.skuId === "SD-CAM");
    assert.ok(sd);
    assert.equal(sd.demandQty, 18);
    assert.equal(sd.excludedStaleQty, 12);
    assert.ok(sd.flags.includes("STALE_DEMAND"));
  });

  it("blocks release at oven load 32/29", () => {
    const plan = buildBatchPlan(baseInput());
    assert.equal(plan.ovenLoad, 32);
    assert.equal(plan.ovenCapacity, 29);
    assert.equal(plan.canRelease, false);
    assert.ok(plan.flags.includes("OVEN_OVER"));
    assert.ok(plan.humanSuggestion);
    assert.equal(plan.humanSuggestion!.skuId, "GN-QUE");
  });

  it("allows release after ginger cut to 0", () => {
    const plan = buildBatchPlan(baseInput());
    const adjusted = applyOvenSuggestion(plan, PLAN_DATE_SKUS, "GN-QUE", 0);
    assert.equal(adjusted.ovenLoad, 29);
    assert.equal(adjusted.canRelease, true);
    assert.equal(adjusted.flags.includes("OVEN_OVER"), false);
  });
});
