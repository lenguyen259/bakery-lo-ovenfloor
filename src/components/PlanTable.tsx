import type { Dictionary } from "@/i18n/vi";

export type PlanRow = {
  skuId: string;
  nameVi?: string | null;
  nameEn?: string | null;
  demandQty: number;
  excludedStaleQty: number;
  leftoverQty: number;
  wasteBufferQty: number;
  plannedQty: number;
  slots: number;
  flags: string[];
};

type Props = {
  dict: Dictionary;
  locale: "vi" | "en";
  lines: PlanRow[];
};

export function PlanTable({ dict, locale, lines }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-cocoa/15">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-cocoa/10 text-cocoa">
          <tr>
            <th className="px-3 py-2">{dict.table.sku}</th>
            <th className="px-3 py-2">{dict.table.demand}</th>
            <th className="px-3 py-2">{dict.table.stale}</th>
            <th className="px-3 py-2">{dict.table.leftover}</th>
            <th className="px-3 py-2">{dict.table.buffer}</th>
            <th className="px-3 py-2">{dict.table.planned}</th>
            <th className="px-3 py-2">{dict.table.slots}</th>
            <th className="px-3 py-2">{dict.table.flags}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.skuId} className="border-t border-cocoa/10 bg-paper/80">
              <td className="px-3 py-2 font-medium">
                <div>{l.skuId}</div>
                <div className="text-xs text-cocoa/70">
                  {locale === "vi" ? l.nameVi : l.nameEn}
                </div>
              </td>
              <td className="px-3 py-2">{l.demandQty}</td>
              <td className="px-3 py-2">{l.excludedStaleQty || "—"}</td>
              <td className="px-3 py-2">{l.leftoverQty}</td>
              <td className="px-3 py-2">{l.wasteBufferQty}</td>
              <td className="px-3 py-2 font-semibold">{l.plannedQty}</td>
              <td className="px-3 py-2">{l.slots}</td>
              <td className="px-3 py-2 text-xs">{l.flags.join(", ") || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
