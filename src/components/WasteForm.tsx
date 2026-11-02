"use client";

export function WasteForm({ locale }: { locale: "vi" | "en" }) {
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/waste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outletId: "KIT-D3",
        skuId: String(fd.get("skuId")),
        eventDate: "2026-11-02",
        qty: Number(fd.get("qty")),
        reason: String(fd.get("reason")),
        note: String(fd.get("note") ?? ""),
      }),
    });
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2 rounded-xl bg-paper p-4 ring-1 ring-cocoa/15">
      <select name="skuId" className="rounded border border-cocoa/20 px-2 py-1">
        <option value="CR-BUT">CR-BUT</option>
        <option value="BM-PAT">BM-PAT</option>
      </select>
      <input name="qty" type="number" defaultValue={2} className="w-20 rounded border px-2 py-1" />
      <select name="reason" className="rounded border border-cocoa/20 px-2 py-1">
        {["overproof", "burn", "stale", "trim", "unsold", "other"].map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <input name="note" placeholder="note" className="rounded border px-2 py-1" />
      <button type="submit" className="rounded bg-pandan px-3 py-1 text-paper">
        {locale === "vi" ? "Ghi" : "Save"}
      </button>
    </form>
  );
}
