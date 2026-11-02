import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api-response";
import { getDemoRole } from "@/lib/session";
import { canRoleRecordWaste } from "@/server/release-policy";

export const dynamic = "force-dynamic";

const reasons = [
  "overproof",
  "burn",
  "stale",
  "trim",
  "unsold",
  "other",
] as const;

const bodySchema = z.object({
  outletId: z.string(),
  skuId: z.string(),
  eventDate: z.string(),
  qty: z.number().int().positive(),
  reason: z.enum(reasons),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const role = await getDemoRole();
  if (!canRoleRecordWaste(role)) {
    return jsonError(
      "FORBIDDEN",
      "Only the supervisor can record waste.",
      "Chỉ tổ trưởng ghi hao hụt.",
      403,
    );
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("INVALID_BODY", "Invalid waste event.", "Sự kiện không hợp lệ.", 400);
  }
  const data = parsed.data;
  const id = `waste-${Date.now()}`;
  await prisma.$transaction(async (tx) => {
    await tx.wasteEvent.create({
      data: {
        id,
        outletId: data.outletId,
        skuId: data.skuId,
        eventDate: new Date(`${data.eventDate}T00:00:00.000Z`),
        qty: data.qty,
        reason: data.reason,
        note: data.note,
        recordedBy: "lan",
      },
    });
    await tx.auditEvent.create({
      data: {
        id: `audit-waste-${Date.now()}`,
        actor: "lan",
        action: "waste.create",
        entity: "waste_event",
        entityId: id,
        detail: data,
      },
    });
  });
  return jsonOk({ id });
}

export async function GET() {
  const since = new Date("2026-10-19");
  const events = await prisma.wasteEvent.findMany({
    where: { eventDate: { gte: since } },
    orderBy: { eventDate: "desc" },
    include: { sku: true, outlet: true },
  });
  return jsonOk({ events });
}
