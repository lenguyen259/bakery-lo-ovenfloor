"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/vi";
import type { PlanRow } from "./PlanTable";
import { PlanTable } from "./PlanTable";
import { AiModeBanner } from "./AiModeBanner";

type Props = {
  dict: Dictionary;
  locale: "vi" | "en";
  forDate: string;
  initialLines: PlanRow[];
  ovenLoad: number;
  ovenCapacity: number;
  canRelease: boolean;
  hasOvenOver: boolean;
  planId: string | null;
  planStatus: string | null;
  latestAudit: string | null;
};

export function FloorDashboard({
  dict,
  locale,
  forDate,
  initialLines,
  ovenLoad,
  ovenCapacity,
  canRelease: initialCanRelease,
  hasOvenOver,
  planId: initialPlanId,
  planStatus: initialStatus,
  latestAudit,
}: Props) {
  const [lines, setLines] = useState(initialLines);
  const [load, setLoad] = useState(ovenLoad);
  const [canRelease, setCanRelease] = useState(initialCanRelease);
  const [planId, setPlanId] = useState(initialPlanId);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [agentAnswer, setAgentAnswer] = useState<string | null>(null);
  const [banner, setBanner] = useState<string>("Chế độ minh hoạ — chưa gọi mô hình");
  const [agentMode, setAgentMode] = useState("demo");

  async function ensureDraft() {
    const res = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forDate }),
    });
    const data = await res.json();
    if (data.ok) {
      setPlanId(data.planId);
      setStatus(data.status);
      if (data.computed) {
        mergeComputed(data.computed, data.computed.lines);
      }
    }
    return data;
  }

  function mergeComputed(
    computed: { ovenLoad: number; canRelease: boolean; lines: PlanRow[] },
    newLines: PlanRow[],
  ) {
    setLoad(computed.ovenLoad);
    setCanRelease(computed.canRelease);
    setLines((prev) =>
      prev.map((p) => {
        const n = newLines.find((l) => l.skuId === p.skuId);
        return n ? { ...p, ...n } : p;
      }),
    );
  }

  async function applySuggestion() {
    let id = planId;
    if (!id) {
      const d = await ensureDraft();
      if (!d.ok) {
        setMessage(d.error?.message_vi ?? "Lỗi");
        return;
      }
      id = d.planId;
    }
    const res = await fetch("/api/plan/suggestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: id }),
    });
    const data = await res.json();
    if (!data.ok) {
      setMessage(locale === "vi" ? data.error.message_vi : data.error.message_en);
      return;
    }
    mergeComputed(data.computed, data.computed.lines);
    setMessage(locale === "vi" ? "Đã cắt GN-QUE về 0." : "GN-QUE set to 0.");
  }

  async function releasePlan() {
    let id = planId;
    if (!id) {
      const d = await ensureDraft();
      if (!d.ok) return;
      id = d.planId;
    }
    const res = await fetch("/api/plan/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: id }),
    });
    const data = await res.json();
    if (!data.ok) {
      setMessage(locale === "vi" ? data.error.message_vi : data.error.message_en);
      return;
    }
    setStatus("released");
    setMessage(locale === "vi" ? "Đã phát hành." : "Plan released.");
  }

  async function askAgent(question: string) {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, locale }),
    });
    const data = await res.json();
    if (!data.ok) {
      setAgentAnswer(data.error?.message_vi ?? "Lỗi");
      return;
    }
    setAgentMode(data.mode);
    setBanner(data.bannerVi);
    const out = data.output;
    setAgentAnswer(locale === "vi" ? out.answer_vi : out.answer_en);
  }

  const blocked = hasOvenOver && load > ovenCapacity;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl italic text-ink">{dict.home.headline}</h1>
          <p className="text-cocoa/80">
            {locale === "vi"
              ? `Kế hoạch mẻ 3 tháng 11 · Bếp demo Quận 3`
              : `Batch plan 3 Nov · Demo kitchen District 3`}
          </p>
        </div>
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            blocked ? "bg-clay/15 text-clay" : canRelease ? "bg-pandan/15 text-pandan" : "bg-caramel/15 text-cocoa"
          }`}
        >
          {dict.home.oven}: {load}/{ovenCapacity} ·{" "}
          {status === "released"
            ? dict.home.released
            : blocked
              ? dict.home.blocked
              : canRelease
                ? dict.home.ready
                : dict.home.blocked}
        </div>
      </div>

      <PlanTable dict={dict} locale={locale} lines={lines} />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-xl bg-cocoa px-5 py-3 text-paper disabled:opacity-40"
          disabled={!blocked}
          onClick={() => applySuggestion()}
        >
          {dict.home.applySuggestion}
        </button>
        <button
          type="button"
          className="rounded-xl bg-pandan px-5 py-3 text-paper disabled:opacity-40"
          disabled={!canRelease || status === "released"}
          onClick={() => releasePlan()}
        >
          {dict.home.release}
        </button>
        <button
          type="button"
          className="rounded-xl ring-1 ring-cocoa/20 px-5 py-3"
          onClick={() => ensureDraft()}
        >
          {dict.home.draft}
        </button>
      </div>

      {message && <p className="text-sm text-cocoa">{message}</p>}
      {latestAudit && (
        <p className="text-xs text-cocoa/70">
          Audit: {latestAudit}
        </p>
      )}

      <section className="rounded-xl bg-paper p-4 ring-1 ring-cocoa/15">
        <h2 className="mb-2 font-display text-2xl italic">{dict.nav.agent}</h2>
        <AiModeBanner mode={agentMode} bannerVi={banner} locale={locale} />
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const q = String(fd.get("question") ?? "");
            if (q) askAgent(q);
          }}
        >
          <input
            name="question"
            className="flex-1 rounded-lg border border-cocoa/20 px-3 py-2"
            placeholder={
              locale === "vi" ? "Vì sao bông lan giảm?" : "Why did pandan drop?"
            }
          />
          <button type="submit" className="rounded-lg bg-caramel px-4 py-2 text-paper">
            {locale === "vi" ? "Hỏi" : "Ask"}
          </button>
        </form>
        {agentAnswer && (
          <p className="mt-3 text-sm leading-relaxed text-ink">{agentAnswer}</p>
        )}
      </section>
    </div>
  );
}
