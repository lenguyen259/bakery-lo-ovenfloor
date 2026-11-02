export function formatDateVi(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export function planSubtitleVi(isoDate: string): string {
  const day = Number(isoDate.split("-")[2]);
  return `Kế hoạch mẻ ${day} tháng 11 · Bếp demo Quận 3`;
}

export function planSubtitleEn(isoDate: string): string {
  const day = Number(isoDate.split("-")[2]);
  return `Batch plan ${day} Nov · Demo kitchen District 3`;
}
