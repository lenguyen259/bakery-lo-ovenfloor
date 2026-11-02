import { cookies } from "next/headers";
import type { DemoRole } from "@/server/release-policy";

export type Locale = "vi" | "en";

const ROLE_COOKIE = "demo_role";
const LOCALE_COOKIE = "locale";

export async function getDemoRole(): Promise<DemoRole> {
  const jar = await cookies();
  const value = jar.get(ROLE_COOKIE)?.value;
  if (value === "planner" || value === "sponsor") return value;
  return "supervisor";
}

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "vi";
}

export { ROLE_COOKIE, LOCALE_COOKIE };
