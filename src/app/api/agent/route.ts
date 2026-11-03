import { z } from "zod";
import { generateObject } from "ai";
import { createLlmProvider, getAiModelId } from "@/lib/ai/provider";
import { prisma } from "@/lib/db";
import {
  agentOutputSchema,
  numbersAllowedInAnswer,
  resolveAiMode,
} from "@/lib/ai/client";
import { OVERRIDE_REFUSAL, pickFixture } from "@/lib/ai/demo-fixtures";
import { jsonError, jsonOk } from "@/lib/api-response";
import { loadPlanInput } from "@/server/plan-input";
import { buildBatchPlan } from "@/server/batch-plan";
import { detectOverrideQuestion } from "@/server/release-policy";
import {
  buildAgentPlanContext,
  tryAnswerDeterministicPlanQuestion,
  validateAgentSkuConsistency,
} from "@/server/agent-plan-lookup";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  question: z.string().min(1).max(500),
  locale: z.enum(["vi", "en"]).optional(),
});

const rateMap = new Map<string, number[]>();

function rateLimited(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (rateMap.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) return true;
  hits.push(now);
  rateMap.set(key, hits);
  return false;
}

function allowedNumbersFromPlan(computed: ReturnType<typeof buildBatchPlan>): number[] {
  const nums = new Set<number>();
  for (const l of computed.lines) {
    nums.add(l.demandQty);
    nums.add(l.excludedStaleQty);
    nums.add(l.leftoverQty);
    nums.add(l.wasteBufferQty);
    nums.add(l.plannedQty);
    nums.add(l.slots);
  }
  nums.add(computed.ovenLoad);
  nums.add(computed.ovenCapacity);
  nums.add(32);
  nums.add(16);
  nums.add(20);
  nums.add(0);
  nums.add(500);
  nums.add(108);
  return [...nums];
}

export async function POST(request: Request) {
  if (request.headers.get("content-length")) {
    const len = Number(request.headers.get("content-length"));
    if (len > 8192) {
      return jsonError("PAYLOAD_TOO_LARGE", "Body too large.", "Nội dung quá lớn.", 413);
    }
  }

  const roleKey = request.headers.get("cookie")?.match(/demo_role=(\w+)/)?.[1] ?? "anon";
  if (rateLimited(roleKey)) {
    return jsonError(
      "RATE_LIMIT",
      "Too many agent requests.",
      "Quá nhiều câu hỏi trợ lý.",
      429,
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("INVALID_BODY", "Invalid question.", "Câu hỏi không hợp lệ.", 400);
  }

  const { question } = parsed.data;
  const forDate = "2026-11-03";
  const input = await loadPlanInput(forDate);
  const computed = buildBatchPlan(input);
  const skuRows = await prisma.sku.findMany({
    where: { active: true },
    select: { id: true, nameEn: true, nameVi: true },
  });
  const skuNames = new Map(
    skuRows.map((s) => [s.id, { nameEn: s.nameEn, nameVi: s.nameVi }]),
  );
  const planJson = buildAgentPlanContext(forDate, computed, skuNames);
  const agentLines = planJson.lines;

  const ai = resolveAiMode();

  if (detectOverrideQuestion(question)) {
    await prisma.agentRun.create({
      data: {
        id: `agent-${Date.now()}`,
        kind: "floor_question",
        mode: ai.mode,
        question,
        inputJson: planJson,
        outputJson: OVERRIDE_REFUSAL,
        failureFlags: ["OVERRIDE_REFUSED"],
      },
    });
    return jsonOk({ output: OVERRIDE_REFUSAL, mode: ai.mode, bannerVi: ai.bannerVi });
  }

  const deterministicAnswer = tryAnswerDeterministicPlanQuestion(
    question,
    planJson,
  );
  if (deterministicAnswer) {
    await prisma.agentRun.create({
      data: {
        id: `agent-${Date.now()}`,
        kind: "floor_question",
        mode: "deterministic",
        question,
        inputJson: planJson,
        outputJson: deterministicAnswer,
        failureFlags: [],
      },
    });
    return jsonOk({
      output: deterministicAnswer,
      mode: "deterministic",
      failureFlags: [],
      bannerVi: "Trả lời từ dữ liệu kế hoạch (không gọi mô hình)",
    });
  }

  let output = pickFixture(question);
  let mode = ai.mode;
  let failureFlags: string[] = [];

  const demoMode = process.env.AI_DEMO_MODE ?? "auto";
  const hasKey = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (demoMode === "on" || (!hasKey && demoMode === "auto")) {
    mode = "demo";
  } else {
    try {
      const llm = createLlmProvider();
      const result = await generateObject({
        model: llm(getAiModelId()),
        schema: agentOutputSchema,
        system: `Explain the batch plan only. Use plan.lines: each row has skuId, nameEn, nameVi, plannedQty, slots, and flags. Never swap SKUs or product names. Every integer in your answer must already appear in the input JSON. Do not propose new planned quantities except mentioning GN-QUE → 0 when OVEN_OVER is present. cited_sku_ids must match the SKUs you describe.`,
        prompt: JSON.stringify({ plan: planJson, question }),
      });
      const allowed = allowedNumbersFromPlan(computed);
      const combined = `${result.object.answer_en} ${result.object.answer_vi}`;
      if (!numbersAllowedInAnswer(combined, allowed)) {
        failureFlags = ["MODEL_NUMBER_DRIFT"];
        output = pickFixture(question);
        mode = "fallback";
      } else if (
        !validateAgentSkuConsistency(result.object, question, planJson)
      ) {
        failureFlags = ["MODEL_SKU_MISMATCH"];
        const fallbackDeterministic = tryAnswerDeterministicPlanQuestion(
          question,
          planJson,
        );
        output = fallbackDeterministic ?? pickFixture(question);
        mode = fallbackDeterministic ? "deterministic" : "fallback";
      } else {
        output = result.object;
        mode = "live";
      }
    } catch {
      output = pickFixture(question);
      mode = "fallback";
      failureFlags = ["MODEL_ERROR"];
    }
  }

  await prisma.agentRun.create({
    data: {
      id: `agent-${Date.now()}`,
      kind: "floor_question",
      mode,
      question,
      inputJson: planJson,
      outputJson: output,
      failureFlags,
    },
  });

  return jsonOk({
    output,
    mode,
    failureFlags,
    bannerVi:
      mode === "deterministic"
        ? "Trả lời từ dữ liệu kế hoạch (không gọi mô hình)"
        : mode === "demo"
          ? "Chế độ minh hoạ — chưa gọi mô hình"
          : mode === "fallback"
            ? "Mô hình lỗi — dùng bản minh hoạ"
            : "Đang dùng mô hình thật",
  });
}
