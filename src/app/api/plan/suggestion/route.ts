import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getDemoRole } from "@/lib/session";
import { loadPlanInput } from "@/server/plan-input";
import { applyOvenSuggestion, buildBatchPlan } from "@/server/batch-plan";
import { canRoleEditPlan } from "@/server/release-policy";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ planId: z.string().min(1) });

export async function POST(request: Request) {
  const role = await getDemoRole();
  if (!canRoleEditPlan(role)) {
    return jsonError(
      "FORBIDDEN",
      "You cannot apply suggestions in this role.",
      "Vai này không được áp dụng gợi ý.",
      403,
    );
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("INVALID_BODY", "Invalid plan.", "Kế hoạch không hợp lệ.", 400);
  }

  const plan = await prisma.batchPlan.findUnique({
    where: { id: parsed.data.planId },
    include: { lines: true },
  });
  if (!plan || plan.status !== "draft") {
    return jsonError(
      "NOT_FOUND",
      "Draft plan not found.",
      "Không tìm thấy bản nháp.",
      404,
    );
  }
  if (!plan.failureFlags.includes("OVEN_OVER")) {
    return jsonError(
      "NO_SUGGESTION",
      "No oven suggestion to apply.",
      "Không có gợi ý lò để áp dụng.",
      409,
    );
  }

  const forDate = plan.forDate.toISOString().slice(0, 10);
  const input = await loadPlanInput(forDate);
  const computed = buildBatchPlan(input);
  const adjusted = applyOvenSuggestion(computed, input.skus, "GN-QUE", 0);

  await prisma.$transaction(async (tx) => {
    for (const line of adjusted.lines) {
      await tx.batchLine.updateMany({
        where: { planId: plan.id, skuId: line.skuId },
        data: {
          plannedQty: line.plannedQty,
          slots: line.slots,
          flags: line.flags,
          constrainedBy: line.constrainedBy,
        },
      });
    }
    await tx.batchPlan.update({
      where: { id: plan.id },
      data: { failureFlags: adjusted.flags },
    });
    await tx.auditEvent.create({
      data: {
        id: `audit-sugg-${Date.now()}`,
        actor: role === "planner" ? "minh" : "lan",
        action: "plan.apply_suggestion",
        entity: "batch_plan",
        entityId: plan.id,
        detail: { skuId: "GN-QUE", plannedQty: 0 },
      },
    });
  });

  return jsonOk({ planId: plan.id, computed: adjusted });
}
