import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/session";

export const dynamic = "force-dynamic";

const FIRM_CUTOFF = new Date("2026-11-01T00:00:00+07:00");

export default async function DemandPage() {
  const locale = await getLocale();
  const signals = await prisma.demandSignal.findMany({
    where: { forDate: new Date("2026-11-03T00:00:00.000Z") },
    include: { sku: true, outlet: true },
    orderBy: [{ skuId: "asc" }, { outletId: "asc" }],
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl italic">
        {locale === "vi" ? "Tín hiệu nhu cầu 3/11" : "Demand signals 3 Nov"}
      </h1>
      <div className="overflow-x-auto rounded-xl ring-1 ring-cocoa/15">
        <table className="min-w-full text-sm">
          <thead className="bg-cocoa/10">
            <tr>
              <th className="px-3 py-2 text-left">SKU</th>
              <th className="px-3 py-2 text-left">
                {locale === "vi" ? "Quầy" : "Outlet"}
              </th>
              <th className="px-3 py-2 text-left">Qty</th>
              <th className="px-3 py-2 text-left">
                {locale === "vi" ? "Trạng thái" : "Status"}
              </th>
            </tr>
          </thead>
          <tbody>
            {signals.map((s) => {
              const stale = s.capturedAt < FIRM_CUTOFF;
              return (
                <tr key={s.id} className="border-t border-cocoa/10">
                  <td className="px-3 py-2">{s.skuId}</td>
                  <td className="px-3 py-2">{s.outletId}</td>
                  <td className="px-3 py-2">{s.qty}</td>
                  <td className="px-3 py-2">
                    {stale ? (
                      <span className="text-clay">STALE_DEMAND</span>
                    ) : (
                      <span className="text-pandan">
                        {locale === "vi" ? "Firm" : "Firm"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
