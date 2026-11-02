import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProcessPage() {
  const locale = await getLocale();
  const steps = await prisma.processStep.findMany({
    orderBy: [{ stream: "asc" }, { sortOrder: "asc" }],
    include: { requirements: true },
  });

  const mfg = steps.filter((s) => s.stream === "manufacturing");
  const ops = steps.filter((s) => s.stream === "operations");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl italic">
          {locale === "vi" ? "Quy trình bếp" : "Kitchen process"}
        </h1>
        <p className="mt-2 text-sm text-cocoa/80">
          OF-R08 ·{" "}
          {locale === "vi"
            ? "Tổ trưởng đọc quy trình sản xuất trên máy tính bảng."
            : "Supervisor reads manufacturing on a tablet."}
        </p>
      </div>
      <Stream title={locale === "vi" ? "Sản xuất" : "Manufacturing"} steps={mfg} locale={locale} />
      <Stream title={locale === "vi" ? "Vận hành" : "Operations"} steps={ops} locale={locale} />
    </div>
  );
}

function Stream({
  title,
  steps,
  locale,
}: {
  title: string;
  steps: Awaited<ReturnType<typeof prisma.processStep.findMany>>;
  locale: "vi" | "en";
}) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-cocoa">{title}</h2>
      <ol className="space-y-4">
        {steps.map((s) => (
          <li key={s.id} className="rounded-xl bg-paper p-4 ring-1 ring-cocoa/15">
            <p className="font-medium">
              {locale === "vi" ? s.nameVi : s.nameEn}
            </p>
            <p className="text-xs text-cocoa/70">
              {s.ownerRole} · {s.systemName}
            </p>
            {"requirements" in s &&
              Array.isArray(s.requirements) &&
              s.requirements.map((r) => (
                <div key={r.id} className="mt-3 rounded-lg bg-cocoa/5 p-3 text-sm">
                  <p className="font-mono text-xs text-pandan">{r.id}</p>
                  <p>{locale === "vi" ? r.statementVi : r.statementEn}</p>
                </div>
              ))}
          </li>
        ))}
      </ol>
    </section>
  );
}
