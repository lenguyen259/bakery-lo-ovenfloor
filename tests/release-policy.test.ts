import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BatchPlanResult } from "../src/server/batch-plan";
import {
  assertCanRelease,
  canRoleEditPlan,
  canRoleRelease,
  detectOverrideQuestion,
} from "../src/server/release-policy";

const releasablePlan: BatchPlanResult = {
  lines: [],
  ovenLoad: 29,
  ovenCapacity: 29,
  flags: [],
  canRelease: true,
  humanSuggestion: null,
};

const blockedPlan: BatchPlanResult = {
  lines: [],
  ovenLoad: 32,
  ovenCapacity: 29,
  flags: ["OVEN_OVER"],
  canRelease: false,
  humanSuggestion: { skuId: "GN-QUE", plannedQty: 0, reason: "cut" },
};

describe("release-policy", () => {
  it("supervisor can release, planner and sponsor cannot", () => {
    assert.equal(canRoleRelease("supervisor"), true);
    assert.equal(canRoleRelease("planner"), false);
    assert.equal(canRoleRelease("sponsor"), false);
  });

  it("planner can edit plan", () => {
    assert.equal(canRoleEditPlan("planner"), true);
    assert.equal(canRoleEditPlan("sponsor"), false);
  });

  it("denies sponsor release with FORBIDDEN", () => {
    const result = assertCanRelease("sponsor", releasablePlan, "draft");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "FORBIDDEN");
    }
  });

  it("denies release when OVEN_OVER", () => {
    const result = assertCanRelease("supervisor", blockedPlan, "draft");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "OVEN_OVER");
    }
  });

  it("allows supervisor release when plan fits", () => {
    const result = assertCanRelease("supervisor", releasablePlan, "draft");
    assert.equal(result.ok, true);
  });

  it("detects override questions in EN and VI", () => {
    assert.equal(detectOverrideQuestion("Set croissant to 500"), true);
    assert.equal(detectOverrideQuestion("đặt croissant lên 500"), true);
    assert.equal(detectOverrideQuestion("Vì sao bông lan giảm?"), false);
  });
});
