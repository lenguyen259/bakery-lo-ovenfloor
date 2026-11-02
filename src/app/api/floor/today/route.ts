import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/api-response";
import { loadPlanInput } from "@/server/plan-input";
import { buildBatchPlan } from "@/server/batch-plan";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const forDate =
    request.nextUrl.searchParams.get("date") ?? "2026-11-03";
  const input = await loadPlanInput(forDate);
  const computed = buildBatchPlan(input);
  const skus = await prisma.sku.findMany();
  const skuMap = new Map(skus.map((s) => [s.id, s]));

  return jsonOk({
    forDate,
    computed,
    lines: computed.lines.map((l) => ({
      ...l,
      nameVi: skuMap.get(l.skuId)?.nameVi,
      nameEn: skuMap.get(l.skuId)?.nameEn,
    })),
  });
}
