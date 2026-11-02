type Props = { mode: string; bannerVi: string; locale: "vi" | "en" };

export function AiModeBanner({ mode, bannerVi, locale }: Props) {
  const label =
    locale === "vi"
      ? bannerVi
      : mode === "demo"
        ? "Demo mode — model not called"
        : mode === "fallback"
          ? "Fallback fixture — model error"
          : "Live model";
  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${
        mode === "live" ? "bg-pandan/15 text-pandan" : "bg-caramel/15 text-cocoa"
      }`}
    >
      {label}
    </p>
  );
}
