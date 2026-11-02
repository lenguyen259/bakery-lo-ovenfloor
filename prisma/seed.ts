import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CAPTURED = new Date("2026-11-02T08:00:00+07:00");
const STALE_CAPTURED = new Date("2026-10-28T08:00:00+07:00");
const PLAN_DATE = new Date("2026-11-03T00:00:00.000Z");
const LEFTOVER_DATE = new Date("2026-11-02T00:00:00.000Z");

async function main() {
  await prisma.auditEvent.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.batchLine.deleteMany();
  await prisma.batchPlan.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.processStep.deleteMany();
  await prisma.wasteEvent.deleteMany();
  await prisma.yieldObservation.deleteMany();
  await prisma.finishedOnHand.deleteMany();
  await prisma.demandSignal.deleteMany();
  await prisma.recipeLine.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredientOnHand.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.oven.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.outlet.deleteMany();

  await prisma.outlet.createMany({
    data: [
      { id: "KIT-D3", name: "Bếp demo Quận 3", kind: "kitchen", district: "Quận 3" },
      { id: "CTR-NH", name: "Quầy demo Nguyễn Huệ", kind: "counter", district: "Quận 1" },
      { id: "CTR-TD", name: "Quầy demo Thảo Điền", kind: "counter", district: "Thủ Đức" },
      { id: "CTR-PMH", name: "Quầy demo Phú Mỹ Hưng", kind: "counter", district: "Quận 7" },
    ],
  });

  const skus = [
    ["BM-PAT", "Bánh mì pate", "Pâté baguette", 10, true],
    ["CR-BUT", "Croissant bơ", "Butter croissant", 12, true],
    ["TT-EGG", "Bánh tart trứng", "Egg tart", 12, true],
    ["BL-PAN", "Bông lan pandan", "Pandan chiffon slice", 8, true],
    ["SD-CAM", "Bánh mì men", "Country loaf", 6, true],
    ["TR-LY", "Tiramisu ly", "Tiramisu cup", 8, true],
    ["GN-QUE", "Bánh gừng que", "Ginger biscuit tin", 6, true],
    ["GQ-TET", "Hộp quà cuối năm", "Year-end gift box", 1, false],
  ] as const;

  for (const [id, nameVi, nameEn, batch, baked] of skus) {
    await prisma.sku.create({
      data: { id, nameVi, nameEn, batchMultiple: batch, baked, active: true },
    });
  }

  const ingredients = [
    ["flour", "Bột mì", "Flour", "g"],
    ["water", "Nước", "Water", "ml"],
    ["butter", "Bơ", "Butter", "g"],
    ["egg", "Trứng", "Egg", "pc"],
    ["cream", "Kem", "Cream", "g"],
    ["ginger", "Gừng", "Ginger", "g"],
    ["box", "Hộp", "Box", "pc"],
    ["ribbon", "Ruy băng", "Ribbon", "pc"],
  ] as const;

  for (const [id, nameVi, nameEn, unit] of ingredients) {
    await prisma.ingredient.create({ data: { id, nameVi, nameEn, unit } });
  }

  await prisma.ingredientOnHand.createMany({
    data: ingredients.map(([id]) => ({
      ingredientId: id,
      qty: id === "egg" ? 20 : 100000,
      asOf: new Date("2026-11-02T12:00:00+07:00"),
    })),
  });

  const recipes: Record<string, { yieldUnits: number; lines: [string, number][] }> = {
    "BM-PAT": { yieldUnits: 10, lines: [["flour", 5], ["water", 3]] },
    "CR-BUT": { yieldUnits: 12, lines: [["flour", 4], ["butter", 6]] },
    "TT-EGG": { yieldUnits: 12, lines: [["flour", 3], ["egg", 6]] },
    "BL-PAN": { yieldUnits: 8, lines: [["flour", 4], ["egg", 10]] },
    "SD-CAM": { yieldUnits: 6, lines: [["flour", 5], ["water", 2]] },
    "TR-LY": { yieldUnits: 8, lines: [["cream", 4], ["flour", 2]] },
    "GN-QUE": { yieldUnits: 6, lines: [["flour", 3], ["ginger", 2]] },
    "GQ-TET": { yieldUnits: 1, lines: [["box", 1], ["ribbon", 1]] },
  };

  for (const [skuId, r] of Object.entries(recipes)) {
    const recipeId = `rcp-${skuId.toLowerCase()}`;
    await prisma.recipe.create({
      data: {
        id: recipeId,
        skuId,
        yieldUnits: r.yieldUnits,
        lines: {
          create: r.lines.map(([ingredientId, qtyPerYield]) => ({
            ingredientId,
            qtyPerYield,
          })),
        },
      },
    });
  }

  await prisma.oven.createMany({
    data: [
      { id: "oven-a", name: "Oven A", decks: 4, bakesPerDay: 4 },
      { id: "oven-b", name: "Oven B", decks: 4, bakesPerDay: 3 },
      { id: "oven-c", name: "Oven C", decks: 1, bakesPerDay: 1 },
    ],
  });

  const demandRows: { outlet: string; sku: string; qty: number; captured: Date }[] = [
    { outlet: "CTR-NH", sku: "BM-PAT", qty: 30, captured: CAPTURED },
    { outlet: "CTR-TD", sku: "BM-PAT", qty: 30, captured: CAPTURED },
    { outlet: "CTR-PMH", sku: "BM-PAT", qty: 20, captured: CAPTURED },
    { outlet: "CTR-NH", sku: "CR-BUT", qty: 40, captured: CAPTURED },
    { outlet: "CTR-TD", sku: "CR-BUT", qty: 36, captured: CAPTURED },
    { outlet: "CTR-PMH", sku: "CR-BUT", qty: 20, captured: CAPTURED },
    { outlet: "CTR-NH", sku: "TT-EGG", qty: 16, captured: CAPTURED },
    { outlet: "CTR-TD", sku: "TT-EGG", qty: 16, captured: CAPTURED },
    { outlet: "CTR-PMH", sku: "TT-EGG", qty: 16, captured: CAPTURED },
    { outlet: "CTR-NH", sku: "BL-PAN", qty: 8, captured: CAPTURED },
    { outlet: "CTR-TD", sku: "BL-PAN", qty: 8, captured: CAPTURED },
    { outlet: "CTR-PMH", sku: "BL-PAN", qty: 8, captured: CAPTURED },
    { outlet: "CTR-NH", sku: "SD-CAM", qty: 10, captured: CAPTURED },
    { outlet: "CTR-TD", sku: "SD-CAM", qty: 8, captured: CAPTURED },
    { outlet: "CTR-PMH", sku: "SD-CAM", qty: 12, captured: STALE_CAPTURED },
    { outlet: "CTR-NH", sku: "TR-LY", qty: 8, captured: CAPTURED },
    { outlet: "CTR-TD", sku: "TR-LY", qty: 4, captured: CAPTURED },
    { outlet: "CTR-PMH", sku: "TR-LY", qty: 4, captured: CAPTURED },
    { outlet: "CTR-NH", sku: "GN-QUE", qty: 4, captured: CAPTURED },
    { outlet: "CTR-TD", sku: "GN-QUE", qty: 4, captured: CAPTURED },
    { outlet: "CTR-PMH", sku: "GN-QUE", qty: 4, captured: CAPTURED },
    { outlet: "CTR-NH", sku: "GQ-TET", qty: 3, captured: CAPTURED },
    { outlet: "CTR-TD", sku: "GQ-TET", qty: 1, captured: CAPTURED },
    { outlet: "CTR-PMH", sku: "GQ-TET", qty: 1, captured: CAPTURED },
  ];

  let i = 0;
  for (const d of demandRows) {
    await prisma.demandSignal.create({
      data: {
        id: `ds-${++i}`,
        outletId: d.outlet,
        skuId: d.sku,
        forDate: PLAN_DATE,
        qty: d.qty,
        source: "pos_import",
        capturedAt: d.captured,
      },
    });
  }

  const leftovers: [string, number][] = [
    ["BM-PAT", 10],
    ["CR-BUT", 8],
    ["TR-LY", 16],
  ];
  for (const [skuId, qty] of leftovers) {
    await prisma.finishedOnHand.create({
      data: { outletId: "KIT-D3", skuId, qty, asOf: LEFTOVER_DATE },
    });
  }

  const wasteRates: Record<string, number> = {
    "BM-PAT": 0.05,
    "CR-BUT": 0.1,
    "TT-EGG": 0.08,
    "BL-PAN": 0.08,
    "SD-CAM": 0.08,
    "TR-LY": 0.08,
    "GN-QUE": 0.08,
    "GQ-TET": 0,
  };

  const historyDays: Record<string, number> = {
    "BM-PAT": 10,
    "CR-BUT": 14,
    "TT-EGG": 10,
    "BL-PAN": 10,
    "SD-CAM": 8,
    "TR-LY": 6,
    "GN-QUE": 3,
    "GQ-TET": 6,
  };

  for (const skuId of Object.keys(wasteRates)) {
    const rate = wasteRates[skuId]!;
    const days = historyDays[skuId]!;
    for (let d = 0; d < days; d++) {
      const eventDate = new Date("2026-11-01T00:00:00.000Z");
      eventDate.setUTCDate(eventDate.getUTCDate() - (days - 1 - d));
      const produced = 100;
      const waste = Math.round(produced * rate);
      await prisma.yieldObservation.create({
        data: {
          skuId,
          eventDate,
          producedQty: produced,
          wasteQty: waste,
        },
      });
    }
  }

  const reasons = ["overproof", "burn", "stale", "trim", "unsold", "other"] as const;
  for (let r = 0; r < reasons.length; r++) {
    await prisma.wasteEvent.create({
      data: {
        id: `we-seed-${reasons[r]}`,
        outletId: reasons[r] === "unsold" ? "CTR-TD" : "KIT-D3",
        skuId: reasons[r] === "unsold" ? "CR-BUT" : "BM-PAT",
        eventDate: new Date("2026-10-25T00:00:00.000Z"),
        qty: r + 1,
        reason: reasons[r],
        recordedBy: "lan",
      },
    });
  }

  const mfgSteps = [
    ["mfg-1", 1, "Scale ingredients", "Cân nguyên liệu", "storekeeper", "Scales", "Clipboard", "Scales disagree with sheet", "Cân lệch phiếu"],
    ["mfg-2", 2, "Mix and rest", "Trộn và nghỉ bột", "baker", "Weights", "Dough", "Clipboard", "", ""],
    ["mfg-3", 3, "Divide and shape", "Chia và tạo hình", "baker", "Dough", "Pieces", "Clipboard", "", ""],
    ["mfg-4", 4, "Proof", "Ủ bột", "baker", "Pieces", "Proofed trays", "Clipboard", "", ""],
    ["mfg-5", 5, "Bake", "Nướng", "baker", "Proofed trays", "Baked goods", "Oven", "Decks overbooked Saturdays", "Lò quá tải cuối tuần"],
    ["mfg-6", 6, "Cool", "Làm mát", "baker", "Hot trays", "Racked goods", "Rack", "", ""],
    ["mfg-7", 7, "Pack and label", "Đóng gói dán nhãn", "packer", "Cooled goods", "Labeled packs", "Clipboard", "", ""],
    ["mfg-8", 8, "Dispatch to counters", "Giao ra quầy", "driver", "Packs", "Counter stock", "Paper run sheet", "", ""],
  ];

  for (const row of mfgSteps) {
    const [id, sort, nameEn, nameVi, owner, inputEn, system, painEn, painVi] = row;
    await prisma.processStep.create({
      data: {
        id,
        stream: "manufacturing",
        sortOrder: Number(sort),
        nameEn,
        nameVi,
        ownerRole: owner,
        inputEn,
        outputEn: inputEn,
        systemName: system,
        painEn: painEn || "—",
        painVi: painVi || "—",
      },
    });
  }

  const opsSteps = [
    ["ops-1", 1, "Read tomorrow outlet demand", "Đọc nhu cầu quầy ngày mai", "planner", "POS export", "Demand lines", "POS import", "", ""],
    ["ops-2", 2, "Check leftover finished goods", "Kiểm tồn thành phẩm", "supervisor", "Rack count", "Leftover qty", "Rack count", "", ""],
    ["ops-3", 3, "Check ingredient coverage", "Kiểm nguyên liệu", "storekeeper", "Stores sheet", "Coverage flags", "Stores sheet", "", ""],
    ["ops-4", 4, "Draft the batch plan", "Lập kế hoạch mẻ", "supervisor", "Demand & stock", "Draft plan", "Ovenfloor", "Draft lives in chat", "Nháp trong chat"],
    ["ops-5", 5, "Supervisor releases plan", "Tổ trưởng phát hành", "supervisor", "Draft plan", "Released plan", "Ovenfloor", "", ""],
    ["ops-6", 6, "Record yield and waste", "Ghi sản lượng & hao hụt", "supervisor", "Production", "Waste book", "Waste book", "Free-text reasons", "Lý do tự do"],
  ];

  for (const row of opsSteps) {
    const [id, sort, nameEn, nameVi, owner, inputEn, outputEn, system, painEn, painVi] = row;
    await prisma.processStep.create({
      data: {
        id,
        stream: "operations",
        sortOrder: Number(sort),
        nameEn,
        nameVi,
        ownerRole: owner,
        inputEn,
        outputEn,
        systemName: system,
        painEn: painEn || "—",
        painVi: painVi || "—",
      },
    });
  }

  const reqs = [
    ["OF-R01", "ops-4", "Night plan quantities come from demand, leftover, waste history, and batch multiple. A person releases.", "Số mẻ đêm tính từ nhu cầu, tồn, hao hụt và bội số mẻ. Con người phát hành.", "now"],
    ["OF-R02", "ops-1", "Demand captured more than 2 days before the bake date is excluded and flagged.", "Nhu cầu cũ hơn 2 ngày bị loại và gắn cờ.", "now"],
    ["OF-R03", "ops-3", "Ingredient shortage reduces the plan to whole batches that fit.", "Thiếu nguyên liệu cắt về whole batch vừa đủ.", "now"],
    ["OF-R04", "mfg-5", "Oven overload blocks release until a person adjusts the plan.", "Lò quá tải chặn phát hành đến khi người chỉnh kế hoạch.", "now"],
    ["OF-R05", "ops-6", "Waste is recorded the same day with a fixed reason list.", "Hao hụt ghi cùng ngày với danh sách lý do cố định.", "next"],
    ["OF-R06", "ops-4", "The model may explain the plan and may not change quantities.", "Mô hình chỉ giải thích, không đổi số lượng.", "now"],
    ["OF-R07", "ops-5", "Every release writes an audit row.", "Mỗi lần phát hành ghi audit.", "now"],
    ["OF-R08", "mfg-5", "A supervisor can read the process in Vietnamese on a tablet.", "Tổ trưởng đọc quy trình tiếng Việt trên máy tính bảng.", "later"],
  ] as const;

  for (const [id, stepId, en, vi, priority] of reqs) {
    await prisma.requirement.create({
      data: {
        id,
        stepId,
        statementEn: en,
        statementVi: vi,
        priority,
        acceptanceEn: `Reviewer sees ${id} on /process`,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
