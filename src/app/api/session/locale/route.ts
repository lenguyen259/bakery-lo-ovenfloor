import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-response";
import { LOCALE_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ locale: z.enum(["vi", "en"]) });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError("INVALID_BODY", "Invalid locale.", "Ngôn ngữ không hợp lệ.", 400);
  }
  const locale = parsed.data.locale;
  const res = NextResponse.json({ ok: true, locale });
  res.cookies.set(LOCALE_COOKIE, locale, { sameSite: "lax", path: "/" });
  return res;
}
