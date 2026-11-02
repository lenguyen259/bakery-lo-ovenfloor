import type { AgentOutput } from "./client";

export const OVERRIDE_REFUSAL: AgentOutput = {
  answer_en:
    "I cannot change planned quantities. The batch plan is computed in code; ask the supervisor to edit or release on the floor screen.",
  answer_vi:
    "Tôi không thể đổi số lượng kế hoạch. Mẻ được tính bằng mã; hãy nhờ tổ trưởng chỉnh hoặc phát hành trên màn hình bếp.",
  cited_sku_ids: ["CR-BUT"],
  flags: ["OVERRIDE_REFUSED"],
};

export const PANDAN_EXPLAIN: AgentOutput = {
  answer_en:
    "Pandan was planned at 32 portions before eggs on hand (20) limited the recipe (10 eggs per 8 portions). The plan now shows 16.",
  answer_vi:
    "Bông lan pandan tính 32 phần trước khi trứng tồn (20) giới hạn công thức (10 trứng / 8 phần). Kế hoạch hiện là 16.",
  cited_sku_ids: ["BL-PAN"],
  flags: [],
};

export function pickFixture(question: string): AgentOutput {
  const q = question.toLowerCase();
  if (
    q.includes("bông lan") ||
    q.includes("pandan") ||
    q.includes("giảm") ||
    q.includes("drop")
  ) {
    return PANDAN_EXPLAIN;
  }
  return {
    answer_en: "The plan numbers come from demand, leftovers, waste history, and oven capacity.",
    answer_vi:
      "Các con số kế hoạch lấy từ nhu cầu, tồn, lịch sử hao hụt và công suất lò.",
    cited_sku_ids: [],
    flags: [],
  };
}
