import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/session";
import { WasteForm } from "@/components/WasteForm";

export const dynamic = "force-dynamic";

export default async function WastePage() {
  const locale = await getLocale();
  const since = new Date("2026-10-19T00:00:00.000Z");
  const events = await prisma.wasteEvent.findMany({
    where: { eventDate: { gte: since } },
    include: { sku: true },
    orderBy: { eventDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl italic">
        {locale === "vi" ? "Hao hụt 14 ngày" : "Waste — last 14 days"}
      </h1>
      <WasteForm locale={locale} />
      <ul className="space-y-2 text-sm">
        {events.map((e) => (
          <li key={e.id} className="rounded-lg bg-paper p-3 ring-1 ring-cocoa/10">
            {e.eventDate.toISOString().slice(0, 10)} · {e.skuId} · {e.qty} ·{" "}
            {e.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
