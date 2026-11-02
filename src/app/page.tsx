import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/session";
import { vi } from "@/i18n/vi";
import { en } from "@/i18n/en";
import { loadPlanInput } from "@/server/plan-input";
import { buildBatchPlan } from "@/server/batch-plan";
import { FloorDashboard } from "@/components/FloorDashboard";

export const dynamic = "force-dynamic";

type TableLine = Awaited<ReturnType<typeof buildBatchPlan>>["lines"][number] & {
  nameVi?: string;
  nameEn?: string;
};

export default async function HomePage() {
  const locale = await getLocale();
  const dict = locale === "en" ? en : vi;
  const forDate = "2026-11-03";

  let tableLines: TableLine[] = [];
  let ovenLoad = 0;
  let ovenCapacity = 29;
  let canRelease = false;
  let hasOvenOver = false;
  let planId: string | null = null;
  let planStatus: string | null = null;
  let latestAudit: string | null = null;
  let dbError = false;

  try {
    const input = await loadPlanInput(forDate);
    const computed = buildBatchPlan(input);
    let lines = computed.lines;
    ovenLoad = computed.ovenLoad;
    ovenCapacity = computed.ovenCapacity;
    canRelease = computed.canRelease;
    let flags = computed.flags;

    const skus = await prisma.sku.findMany();
    const skuMap = new Map(skus.map((s) => [s.id, s]));

    const draft = await prisma.batchPlan.findFirst({
      where: {
        forDate: new Date(`${forDate}T00:00:00.000Z`),
        status: { in: ["draft", "released"] },
      },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
    });
    if (draft) {
      planId = draft.id;
      planStatus = draft.status;
      lines = draft.lines.map((l) => ({
        skuId: l.skuId,
        demandQty: l.demandQty,
        excludedStaleQty: l.excludedStaleQty,
        leftoverQty: l.leftoverQty,
        wasteBufferQty: l.wasteBufferQty,
        plannedQty: l.plannedQty,
        slots: l.slots,
        constrainedBy: (l.constrainedBy ?? "none") as "ingredient" | "oven" | "none",
        flags: l.flags,
      }));
      ovenLoad = draft.lines.reduce((s, l) => s + l.slots, 0);
      canRelease = !draft.failureFlags.includes("OVEN_OVER");
      flags = draft.failureFlags;
    }

    const audit = await prisma.auditEvent.findFirst({
      orderBy: { at: "desc" },
    });
    if (audit) {
      latestAudit = `${audit.action} · ${audit.actor} · ${audit.at.toISOString()}`;
    }

    tableLines = lines.map((l) => ({
      ...l,
      nameVi: skuMap.get(l.skuId)?.nameVi,
      nameEn: skuMap.get(l.skuId)?.nameEn,
    }));
    hasOvenOver = flags.includes("OVEN_OVER") || ovenLoad > ovenCapacity;
  } catch {
    dbError = true;
  }

  if (dbError) {
    return (
      <p className="text-clay">
        {locale === "vi"
          ? "Không kết nối được cơ sở dữ liệu. Chạy migrate và seed."
          : "Database unavailable. Run migrate and seed."}
      </p>
    );
  }

  return (
    <FloorDashboard
      dict={dict}
      locale={locale}
      forDate={forDate}
      initialLines={tableLines}
      ovenLoad={ovenLoad}
      ovenCapacity={ovenCapacity}
      canRelease={canRelease}
      hasOvenOver={hasOvenOver}
      planId={planId}
      planStatus={planStatus}
      latestAudit={latestAudit}
    />
  );
}
