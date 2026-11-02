import type { Locale } from "@/lib/session";

type Props = { locale: Locale };

export function TrustPanel({ locale }: Props) {
  const items =
    locale === "vi"
      ? [
          "Tín hiệu nhu cầu cũ hơn 2 ngày bị loại khỏi mẻ.",
          "SKU ít lịch sử dùng hệ số hao hụt mặc định 8%.",
          "Mô hình chỉ giải thích; số lượng do mã tính.",
          "Không có API key → chế độ minh hoạ có nhãn rõ.",
        ]
      : [
          "Demand captured more than 2 days before bake date is excluded.",
          "Thin history SKUs use the default 8% waste rate.",
          "The model explains only; quantities come from code.",
          "No API key → labeled demo fixtures.",
        ];
  return (
    <ul className="list-disc space-y-2 pl-5 text-sm text-cocoa/90">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}
