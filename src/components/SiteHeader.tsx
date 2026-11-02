"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/i18n/vi";

type Props = {
  dict: Dictionary;
  locale: "vi" | "en";
};

const links = [
  { href: "/", key: "plan" as const },
  { href: "/process", key: "process" as const },
  { href: "/demand", key: "demand" as const },
  { href: "/waste", key: "waste" as const },
  { href: "/trust", key: "trust" as const },
  { href: "/agent", key: "agent" as const },
];

export function SiteHeader({ dict, locale }: Props) {
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
    <header className="border-b border-cocoa/20 bg-paper/90 backdrop-blur-sm sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-cocoa/70">{dict.kicker}</p>
          <Link href="/" className="font-display text-3xl italic text-ink">
            {dict.wordmark}
          </Link>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 ${
                pathname === l.href
                  ? "bg-pandan text-paper"
                  : "bg-paper text-ink ring-1 ring-cocoa/15"
              }`}
            >
              {dict.nav[l.key]}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="text-cocoa/80">{dict.home.role}</label>
          <select
            className="rounded-lg border border-cocoa/20 bg-paper px-2 py-1"
            defaultValue="supervisor"
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="supervisor">{dict.roles.supervisor}</option>
            <option value="planner">{dict.roles.planner}</option>
            <option value="sponsor">{dict.roles.sponsor}</option>
          </select>
          <button
            type="button"
            className="rounded-lg bg-caramel px-3 py-1 text-paper"
            onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
          >
            {locale === "vi" ? "EN" : "VI"}
          </button>
        </div>
      </div>
    </header>
  );
}
