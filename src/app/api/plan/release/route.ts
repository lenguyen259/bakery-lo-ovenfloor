import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getDemoRole } from "@/lib/session";
import { loadPlanInput } from "@/server/plan-input";
import { buildBatchPlan } from "@/server/batch-plan";
import { assertCanRelease } from "@/server/release-policy";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ planId: z.string().min(1) });

export async function POST(request: Request) {
  const role = await getDemoRole();
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

  const forDate = plan.forDate.toISOString().slice(0, 10);
  const input = await loadPlanInput(forDate);
  const fromLines = {
    lines: plan.lines.map((l) => ({
      skuId: l.skuId,
      demandQty: l.demandQty,
      excludedStaleQty: l.excludedStaleQty,
      leftoverQty: l.leftoverQty,
      wasteBufferQty: l.wasteBufferQty,
      plannedQty: l.plannedQty,
      slots: l.slots,
      constrainedBy: (l.constrainedBy ?? "none") as "ingredient" | "oven" | "none",
      flags: l.flags,
    })),
    ovenLoad: plan.lines.reduce((s, l) => s + l.slots, 0),
    ovenCapacity: buildBatchPlan(input).ovenCapacity,
    flags: plan.failureFlags,
    canRelease: !plan.failureFlags.includes("OVEN_OVER"),
    humanSuggestion: null,
  };

  const check = assertCanRelease(role, fromLines, plan.status);
  if (!check.ok) {
    return jsonError(check.code, check.messageEn, check.messageVi, check.code === "FORBIDDEN" ? 403 : 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.batchPlan.updateMany({
      where: {
        forDate: plan.forDate,
        status: "released",
      },
      data: { status: "superseded" },
    });
    await tx.batchPlan.update({
      where: { id: plan.id },
      data: {
        status: "released",
        releasedBy: "lan",
      },
    });
    await tx.auditEvent.create({
      data: {
        id: `audit-rel-${Date.now()}`,
        actor: "lan",
        action: "plan.release",
        entity: "batch_plan",
        entityId: plan.id,
        detail: { forDate },
      },
    });
  });

  return jsonOk({ planId: plan.id, status: "released" });
}
