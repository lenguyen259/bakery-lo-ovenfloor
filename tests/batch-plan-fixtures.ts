import type { BatchPlanInput, SkuPlanInput } from "../src/server/batch-plan";

export const PLAN_DATE_SKUS: SkuPlanInput[] = [
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

export function baseInput(): BatchPlanInput {
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
