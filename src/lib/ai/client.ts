import { z } from "zod";

export const agentOutputSchema = z.object({
  answer_en: z.string(),
  answer_vi: z.string(),
  cited_sku_ids: z.array(z.string()),
  flags: z.array(z.string()),
});

export type AgentOutput = z.infer<typeof agentOutputSchema>;

export type AiMode = "demo" | "live" | "fallback";

export function resolveAiMode(): {
  mode: AiMode;
  configured: boolean;
  bannerVi: string;
} {
  const key = process.env.OPENAI_API_KEY?.trim();
  const demoMode = process.env.AI_DEMO_MODE ?? "auto";
  const configured = Boolean(key);

  if (demoMode === "on" || (!configured && demoMode === "auto")) {
    return {
      mode: "demo",
      configured,
      bannerVi: "Chế độ minh hoạ — chưa gọi mô hình",
    };
  }
  return {
    mode: configured ? "live" : "demo",
    configured,
    bannerVi: configured
      ? "Đang dùng mô hình thật"
      : "Chế độ minh hoạ — chưa gọi mô hình",
  };
}

export function extractIntegers(text: string): number[] {
  const matches = text.match(/\d+/g);
  return matches ? matches.map((m) => Number(m)) : [];
}

export function numbersAllowedInAnswer(
  answer: string,
  allowed: number[],
): boolean {
  const found = extractIntegers(answer);
  const allowedSet = new Set(allowed);
  return found.every((n) => allowedSet.has(n));
}
