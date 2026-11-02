import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api-response";
import { ROLE_COOKIE } from "@/lib/session";
import type { DemoRole } from "@/server/release-policy";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  role: z.enum(["supervisor", "planner", "sponsor"]),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(
      "INVALID_BODY",
      "Invalid role.",
      "Vai không hợp lệ.",
      400,
    );
  }
  const role = parsed.data.role as DemoRole;
  await prisma.auditEvent.create({
    data: {
      id: `audit-role-${Date.now()}`,
      actor: role,
      action: "session.role",
      entity: "session",
      entityId: role,
      detail: { role },
    },
  });
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
