import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyOvenSuggestion,
  buildBatchPlan,
} from "../src/server/batch-plan";
import { baseInput, PLAN_DATE_SKUS } from "./batch-plan-fixtures";

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

  it("blocks release at oven load 30/29", () => {
    const plan = buildBatchPlan(baseInput());
    assert.equal(plan.ovenLoad, 30);
    assert.equal(plan.ovenCapacity, 29);
    assert.equal(plan.canRelease, false);
    assert.ok(plan.flags.includes("OVEN_OVER"));
    assert.ok(plan.humanSuggestion);
    assert.equal(plan.humanSuggestion!.skuId, "GN-QUE");
  });

  it("allows release after ginger cut to 0", () => {
    const plan = buildBatchPlan(baseInput());
    const adjusted = applyOvenSuggestion(plan, PLAN_DATE_SKUS, "GN-QUE", 0);
    assert.equal(adjusted.ovenLoad, 27);
    assert.equal(adjusted.canRelease, true);
    assert.equal(adjusted.flags.includes("OVEN_OVER"), false);
  });
});
