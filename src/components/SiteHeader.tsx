"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/i18n/vi";

const links = [
  { href: "/", key: "plan" as const },
  { href: "/process", key: "process" as const },
  { href: "/demand", key: "demand" as const },
  { href: "/waste", key: "waste" as const },
  { href: "/trust", key: "trust" as const },
  { href: "/agent", key: "agent" as const },
];

export function SiteHeader({ dict, locale }: { dict: Dictionary; locale: "vi" | "en" }) {
  const pathname = usePathname();

  async function setLocale(next: "vi" | "en") {
    await fetch("/api/session/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    window.location.reload();
  }

  async function setRole(role: string) {
    await fetch("/api/session/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    window.location.reload();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-cocoa/10 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-cocoa/60">
              {dict.kicker}
            </p>
            <Link href="/" className="font-display text-3xl italic leading-tight text-ink">
              {dict.wordmark}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2 text-cocoa/70">
              <span>{dict.home.role}</span>
              <select
                className="rounded-md border border-cocoa/15 bg-white/50 px-2 py-1.5"
                defaultValue="supervisor"
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="supervisor">{dict.roles.supervisor}</option>
                <option value="planner">{dict.roles.planner}</option>
                <option value="sponsor">{dict.roles.sponsor}</option>
              </select>
            </label>
            <button
              type="button"
              className="rounded-md border border-cocoa/15 bg-white/50 px-3 py-1.5 text-ink/80"
              onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
            >
              {locale === "vi" ? "EN" : "VI"}
            </button>
          </div>
        </div>
        <nav className="mt-3 flex gap-1 overflow-x-auto border-t border-cocoa/10 pt-2 text-sm">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 border-b-2 px-3 py-2 ${
                  active
                    ? "border-pandan font-medium text-ink"
                    : "border-transparent text-ink/70 hover:border-cocoa/20 hover:text-ink"
                }`}
              >
                {dict.nav[l.key]}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
