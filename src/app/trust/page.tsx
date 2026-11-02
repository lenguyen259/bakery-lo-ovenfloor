import { getLocale } from "@/lib/session";
import { TrustPanel } from "@/components/TrustPanel";

export const dynamic = "force-dynamic";

export default async function TrustPage() {
  const locale = await getLocale();
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="font-display text-4xl italic">
        {locale === "vi" ? "Giới hạn & tin cậy" : "Trust & limits"}
      </h1>
      <TrustPanel locale={locale} />
    </div>
  );
}
