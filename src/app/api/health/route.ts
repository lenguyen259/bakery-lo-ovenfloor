import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAiMode } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

export async function GET() {
  let db: "up" | "down" = "down";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "up";
  } catch {
    db = "down";
  }
  const ai = resolveAiMode();
  return NextResponse.json({
    ok: db === "up",
    db,
    ai: ai.configured ? "configured" : "demo",
  });
}
