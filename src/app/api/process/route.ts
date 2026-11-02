import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const steps = await prisma.processStep.findMany({
    orderBy: [{ stream: "asc" }, { sortOrder: "asc" }],
    include: { requirements: true },
  });
  return jsonOk({ steps });
}
