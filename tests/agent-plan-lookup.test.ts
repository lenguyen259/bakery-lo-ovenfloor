import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildBatchPlan,
  type BatchPlanInput,
} from "../src/server/batch-plan";
import {
  buildAgentPlanContext,
  tryAnswerDeterministicPlanQuestion,
  validateAgentSkuConsistency,
  type AgentPlanLine,
} from "../src/server/agent-plan-lookup";
import {
  baseInput,
  PLAN_DATE_SKUS,
} from "./batch-plan-fixtures";

describe("agent-plan-lookup", () => {
  const computed = buildBatchPlan(baseInput());
  const skuNames = new Map(
    PLAN_DATE_SKUS.map((s) => [
      s.skuId,
      { nameEn: s.skuId, nameVi: s.skuId },
    ]),
  );
  const context = buildAgentPlanContext("2026-11-03", computed, skuNames);

  it("resolves tiramisu cup to TR-LY not TT-EGG", () => {
    const out = tryAnswerDeterministicPlanQuestion(
      "how many slots of tiramisu cup?",
      {
        ...context,
        lines: context.lines.map((l) =>
          l.skuId === "TR-LY"
            ? { ...l, nameEn: "Tiramisu cup", nameVi: "Tiramisu ly" }
            : l.skuId === "TT-EGG"
              ? { ...l, nameEn: "Egg tart", nameVi: "Bánh trứng" }
              : l,
        ),
      },
    );
    assert.ok(out);
    assert.deepEqual(out!.cited_sku_ids, ["TR-LY"]);
    assert.match(out!.answer_en, /\b1\b/);
    assert.doesNotMatch(out!.answer_en, /TT-EGG/);
  });

  it("answers oven load 30/29", () => {
    const out = tryAnswerDeterministicPlanQuestion(
      "what is the oven load?",
      context,
    );
    assert.ok(out);
    assert.match(out!.answer_en, /30\/29/);
  });

  for (const line of computed.lines) {
    it(`slots for ${line.skuId} match plan`, () => {
      const out = tryAnswerDeterministicPlanQuestion(
        `how many slots for ${line.skuId}?`,
        context,
      );
      assert.ok(out, line.skuId);
      assert.match(out!.answer_en, new RegExp(`\\b${line.slots}\\b`));
      assert.match(out!.answer_en, new RegExp(line.skuId));
    });

    it(`planned qty for ${line.skuId} match plan`, () => {
      const out = tryAnswerDeterministicPlanQuestion(
        `what is the planned quantity for ${line.skuId}?`,
        context,
      );
      assert.ok(out, line.skuId);
      assert.match(out!.answer_en, new RegExp(`\\b${line.plannedQty}\\b`));
    });
  }

  it("rejects LLM-style SKU mismatch for tiramisu slot question", () => {
    const lines: AgentPlanLine[] = [
      {
        skuId: "TR-LY",
        nameEn: "Tiramisu cup",
        nameVi: "Tiramisu ly",
        demandQty: 16,
        excludedStaleQty: 0,
        leftoverQty: 16,
        wasteBufferQty: 2,
        plannedQty: 8,
        slots: 1,
        constrainedBy: "none",
        flags: [],
      },
      {
        skuId: "TT-EGG",
        nameEn: "Egg tart",
        nameVi: "Bánh trứng",
        demandQty: 48,
        excludedStaleQty: 0,
        leftoverQty: 0,
        wasteBufferQty: 4,
        plannedQty: 36,
        slots: 3,
        constrainedBy: "ingredient",
        flags: [],
      },
    ];
    const ctx = { ...context, lines };
    const ok = validateAgentSkuConsistency(
      {
        answer_en:
          "The plan allocates 3 oven slots to the tiramisu cup (TT-EGG).",
        answer_vi: "Kế hoạch dành 3 chỗ lò cho tiramisu (TT-EGG).",
        cited_sku_ids: ["TT-EGG"],
        flags: [],
      },
      "how many slots of tiramisu cup?",
      ctx,
    );
    assert.equal(ok, false);
  });
});
