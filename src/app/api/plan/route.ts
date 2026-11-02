import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getDemoRole } from "@/lib/session";
import { loadPlanInput } from "@/server/plan-input";
import { buildBatchPlan } from "@/server/batch-plan";
import { canRoleEditPlan } from "@/server/release-policy";
import { resolveAiMode } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  forDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  const role = await getDemoRole();
  if (!canRoleEditPlan(role)) {
    return jsonError(
      "FORBIDDEN",
      "You cannot edit the plan in this role.",
      "Vai này không được sửa kế hoạch.",
      403,
    );
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("INVALID_BODY", "Invalid date.", "Ngày không hợp lệ.", 400);
  }
  const { forDate } = parsed.data;
  const planDate = new Date(`${forDate}T00:00:00.000Z`);

  const existingDraft = await prisma.batchPlan.findFirst({
    where: { forDate: planDate, status: "draft" },
  });
  if (existingDraft) {
    return jsonOk({ planId: existingDraft.id, status: existingDraft.status });
  }

  const input = await loadPlanInput(forDate);
  const computed = buildBatchPlan(input);
  const ai = resolveAiMode();
  const planId = `plan-${forDate}-draft`;

  await prisma.$transaction(async (tx) => {
    await tx.batchPlan.create({
      data: {
        id: planId,
        forDate: planDate,
        status: "draft",
        mode: ai.mode,
        narrativeEn: "Draft saved from computed plan.",
        narrativeVi: "Bản nháp lưu từ kế hoạch tính toán.",
        failureFlags: computed.flags,
        createdBy: role === "planner" ? "minh" : "lan",
        lines: {
          create: computed.lines.map((l) => ({
            id: `${planId}-${l.skuId}`,
            skuId: l.skuId,
            demandQty: l.demandQty,
            excludedStaleQty: l.excludedStaleQty,
            leftoverQty: l.leftoverQty,
            wasteBufferQty: l.wasteBufferQty,
            plannedQty: l.plannedQty,
            slots: l.slots,
            constrainedBy: l.constrainedBy,
            flags: l.flags,
          })),
        },
      },
    });
  });

  return jsonOk({ planId, status: "draft", computed });
}
